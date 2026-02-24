import { Module } from '@nestjs/common';
import { ChainModule } from 'src/chain/chain.module';
import { ScannerService } from './scanner.service';
import { CacheService } from './cache.service';

@Module({
  imports: [ChainModule],
  providers: [ScannerService, CacheService],
  exports: [ScannerService],
})
export class ScannerModule {}
