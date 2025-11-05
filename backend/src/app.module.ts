import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { envConfig } from './common/config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [envConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    HealthModule,
    BlockchainModule,
    SubscriptionModule,
  ],
})
export class AppModule {}