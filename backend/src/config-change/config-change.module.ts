import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigChangeController } from './config-change.controller';
import { ConfigChangeService } from './config-change.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ConfigChangeController],
  providers: [ConfigChangeService],
  exports: [ConfigChangeService],
})
export class ConfigChangeModule {}
