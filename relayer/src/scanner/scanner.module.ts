import { EventHandlerRegistry } from 'src/common';
import { GrpcModule } from 'src/grpc/grpc.module';

import { Module } from '@nestjs/common';

import { IntentCreatedHandler } from './handlers';
import { ScannerService } from './scanner.service';

@Module({
  imports: [GrpcModule],
  providers: [EventHandlerRegistry, IntentCreatedHandler, ScannerService],
  exports: [ScannerService],
})
export class ScannerModule {}
