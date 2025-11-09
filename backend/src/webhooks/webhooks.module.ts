import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhooksService } from "./webhooks.service";
import { WebhooksController } from "./webhooks.controller";
import { DatabaseModule } from "../database/database.module";
import { Anomaly } from "../entities/anomaly.entity";
import { Wallet } from "../entities/wallet.entity";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Anomaly, Wallet])],
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
