import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';
import { ChainModule } from './chain/chain.module';
import { ConfigModule } from './config/config.module';
import { ContractModule } from './contracts/contract.module';
import { GrpcModule } from './grpc/grpc.module';
import { KeeperModule } from './keeper/keeper.module';
import { ScannerModule } from './scanner/scanner.module';

@Module({
  imports: [
    CacheModule, // @Global — available to all modules
    ConfigModule,
    ContractModule,
    ChainModule,
    GrpcModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue(
      { name: 'lifecycleCloseCommits' },
      { name: 'lifecycleTriggerFallback' },
    ),
    KeeperModule,
    ScannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
