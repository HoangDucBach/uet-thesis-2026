import { ChainModule } from 'src/chain/chain.module';
import { ConfigModule } from 'src/config/config.module';
import { ContractModule } from 'src/contracts/contract.module';
import { ScannerModule } from 'src/scanner/scanner.module';

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';
import { CloseCommitsProcessor } from './close-commits.processor';
import { KeeperService } from './keeper.service';
import { LifecycleService } from './lifecycle.service';
import { TriggerFallbackProcessor } from './trigger-fallback.processor';
import { WinnerWatcherService } from './winner-watcher.service';

@Module({
  imports: [
    ScannerModule,
    ChainModule,
    ContractModule,
    ConfigModule,
    BullModule,
  ],
  providers: [
    KeeperService,
    BatchStateService,
    LifecycleService,
    WinnerWatcherService,
    CloseCommitsProcessor,
    TriggerFallbackProcessor,
  ],
  exports: [
    KeeperService,
    BatchStateService,
    LifecycleService,
    WinnerWatcherService,
  ],
})
export class KeeperModule {}
