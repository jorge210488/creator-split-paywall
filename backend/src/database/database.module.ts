import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Wallet } from "../entities/wallet.entity";
import { Subscription } from "../entities/subscription.entity";
import { Payment } from "../entities/payment.entity";
import { ProcessedEvent } from "../entities/processed-event.entity";
import { Contract } from "../entities/contract.entity";
import { Anomaly } from "../entities/anomaly.entity";
import { Creator } from "../entities/creator.entity";
import { Collaborator } from "../entities/collaborator.entity";
import { Payout } from "../entities/payout.entity";
import { WebhookDelivery } from "../entities/webhook-delivery.entity";
import { AuditLog } from "../entities/audit-log.entity";
import { ConfigChange } from "../entities/config-change.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get("DATABASE_URL"),
        entities: [
          Wallet,
          Subscription,
          Payment,
          ProcessedEvent,
          Contract,
          Anomaly,
          Creator,
          Collaborator,
          Payout,
          WebhookDelivery,
          AuditLog,
          ConfigChange,
        ],
        synchronize: false,
        logging: configService.get("NODE_ENV") !== "production",
      }),
    }),
    TypeOrmModule.forFeature([
      Wallet,
      Subscription,
      Payment,
      ProcessedEvent,
      Contract,
      Anomaly,
      Creator,
      Collaborator,
      Payout,
      WebhookDelivery,
      AuditLog,
      ConfigChange,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
