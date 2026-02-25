import { Module } from '@nestjs/common';
import { ScannerModule } from 'src/scanner/scanner.module';
import { ChainModule } from 'src/chain/chain.module';
import { ContractModule } from 'src/contracts/contract.module';
import { ConfigModule } from 'src/config/config.module';
import { KeeperService } from './keeper.service';
import { BatchStateService } from './batch-state.service';

@Module({
  imports: [ScannerModule, ChainModule, ContractModule, ConfigModule],
  providers: [KeeperService, BatchStateService],
  exports: [KeeperService, BatchStateService],
})
export class KeeperModule {}
