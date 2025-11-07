import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Anomaly } from "../entities/anomaly.entity";
import { AnomalyWebhookDto } from "./dto/anomaly-webhook.dto";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Anomaly)
    private anomalyRepository: Repository<Anomaly>
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
}
