import { GrpcModule } from 'src/grpc/grpc.module';

import { Module } from '@nestjs/common';

import { ScannerService } from './scanner.service';

@Module({
  imports: [GrpcModule],
  providers: [ScannerService],
  exports: [ScannerService],
})
export class ScannerModule {}
