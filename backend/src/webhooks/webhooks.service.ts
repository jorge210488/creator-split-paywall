import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Anomaly,
  AnomalyType,
  AnomalySeverity,
} from "../entities/anomaly.entity";
import {
  AnomalyWebhookDto,
  AnalyticsAnomalyWebhookDto,
} from "./dto/anomaly-webhook.dto";
import { Wallet } from "../entities/wallet.entity";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Anomaly)
    private anomalyRepository: Repository<Anomaly>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>
  ) {}

  async handleAnomaly(dto: AnomalyWebhookDto) {
    this.logger.log(`Received anomaly webhook: ${dto.type} - ${dto.severity}`);

    const anomaly = this.anomalyRepository.create({
      type: dto.type,
      severity: dto.severity,
      walletAddress: dto.walletAddress?.toLowerCase(),
      description: dto.description,
      metadata: dto.metadata,
      resolved: false,
    });

    await this.anomalyRepository.save(anomaly);

    this.logger.log(`Anomaly saved: ${anomaly.id}`);

    return {
      success: true,
      anomalyId: anomaly.id,
      message: "Anomaly recorded successfully",
    };
  }

  async handleAnalyticsAnomaly(dto: AnalyticsAnomalyWebhookDto) {
    this.logger.log(
      `Received analytics anomaly: ${dto.rule} for ${dto.address} (score: ${dto.score})`
    );

    try {
      // Get or create wallet
      const normalizedAddress = dto.address.toLowerCase();
      let wallet = await this.walletRepository.findOne({
        where: { address: normalizedAddress },
      });

      if (!wallet) {
        this.logger.debug(`Creating new wallet for ${normalizedAddress}`);
        wallet = this.walletRepository.create({ address: normalizedAddress });
        await this.walletRepository.save(wallet);
      }

      // Determine severity based on score and rule
      let severity: AnomalySeverity;
      if (dto.score >= 4.0 || dto.rule === "ISOLATION_FOREST") {
        severity = AnomalySeverity.HIGH;
      } else if (dto.score >= 2.5) {
        severity = AnomalySeverity.MEDIUM;
      } else {
        severity = AnomalySeverity.LOW;
      }

      // Build description
      const description = `Payment anomaly detected: ${dto.meta.amountEth.toFixed(
        6
      )} ETH (${dto.meta.ratio.toFixed(2)}x normal) via ${dto.rule}`;

      // Create anomaly record
      const anomaly = this.anomalyRepository.create({
        type: AnomalyType.UNUSUAL_PAYMENT_AMOUNT,
        severity,
        walletAddress: normalizedAddress,
        description,
        metadata: {
          txHash: dto.txHash,
          blockNumber: dto.blockNumber,
          logIndex: dto.logIndex,
          amountWei: dto.amountWei,
          rule: dto.rule,
          score: dto.score,
          dedupeKey: dto.dedupeKey,
          ts: dto.ts,
          ...dto.meta,
        },
        resolved: false,
      });

      this.logger.debug(`Saving anomaly to DB`, { anomaly });
      await this.anomalyRepository.save(anomaly);

      this.logger.log(
        `Analytics anomaly saved: ${anomaly.id} (${severity}) - ${dto.txHash}`
      );

      return {
        success: true,
        anomalyId: anomaly.id,
        message: "Analytics anomaly recorded successfully",
        severity,
      };
    } catch (error) {
      this.logger.error(
        `Failed to save analytics anomaly: ${error.message}`,
        error.stack
      );
      throw error; // Re-throw so Nest returns 500 with actual error
    }
  }
}
