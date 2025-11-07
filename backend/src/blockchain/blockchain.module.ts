import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BlockchainService } from "./blockchain.service";
import { BlockchainController } from "./blockchain.controller";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
