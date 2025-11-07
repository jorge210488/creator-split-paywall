import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { PayoutController } from "./payout.controller";
import { PayoutService } from "./payout.service";

@Module({
  imports: [DatabaseModule],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
