import { Module } from '@nestjs/common';
import { ChainModule } from 'src/chain/chain.module';
import { ScannerService } from './scanner.service';

@Module({
  imports: [ChainModule],
  providers: [ScannerService],
  exports: [ScannerService],
})
export class ScannerModule {}
