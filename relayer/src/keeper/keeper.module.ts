import { Module } from '@nestjs/common';
import { ScannerModule } from 'src/scanner/scanner.module';
import { ChainModule } from 'src/chain/chain.module';
import { ContractModule } from 'src/contracts/contract.module';
import { KeeperService } from './keeper.service';

@Module({
  imports: [ScannerModule, ChainModule, ContractModule],
  providers: [KeeperService],
  exports: [KeeperService],
})
export class KeeperModule {}
