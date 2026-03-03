import { ChainModule } from 'src/chain/chain.module';
import { EventHandlerRegistry } from 'src/common';
import { ConfigModule } from 'src/config/config.module';
import { ContractModule } from 'src/contracts/contract.module';
import { GrpcModule } from 'src/grpc/grpc.module';
import { ScannerModule } from 'src/scanner/scanner.module';

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';
import { CloseCommitsProcessor } from './close-commits.processor';
import {
  BatchAbortedHandler,
  FallbackTriggeredHandler,
  SettlementCompleteHandler,
  WinnerSelectedHandler,
} from './handlers';
import { KeeperService } from './keeper.service';
import { LifecycleService } from './lifecycle.service';
import { SettlementWatcherService } from './settlement-watcher.service';
import { TriggerFallbackProcessor } from './trigger-fallback.processor';

@Module({
  imports: [
    ScannerModule,
    ChainModule,
    ContractModule,
    ConfigModule,
    GrpcModule,
    BullModule.registerQueue({
      name: 'lifecycleCloseCommits',
    }),
    BullModule.registerQueue({
      name: 'lifecycleTriggerFallback',
    }),
  ],
  providers: [
    EventHandlerRegistry,
    KeeperService,
    BatchStateService,
    LifecycleService,
    SettlementWatcherService,
    CloseCommitsProcessor,
    TriggerFallbackProcessor,
    // Event Handlers
    WinnerSelectedHandler,
    SettlementCompleteHandler,
    FallbackTriggeredHandler,
    BatchAbortedHandler,
  ],
  exports: [
    KeeperService,
    BatchStateService,
    LifecycleService,
    SettlementWatcherService,
  ],
})
export class KeeperModule {}
