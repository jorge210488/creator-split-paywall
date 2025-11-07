import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { BlockchainModule } from "./blockchain/blockchain.module";
import { SubscriptionModule } from "./subscription/subscription.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { PayoutModule } from "./payout/payout.module";
import { ConfigChangeModule } from "./config-change/config-change.module";
import { envConfig } from "./common/config/env.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [envConfig],
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    BlockchainModule,
    SubscriptionModule,
    WebhooksModule,
    PayoutModule,
    ConfigChangeModule,
  ],
})
export class AppModule {}
