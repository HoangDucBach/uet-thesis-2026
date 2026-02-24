import { Module } from '@nestjs/common';
import { ChainService } from './chain.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [ChainService],
  exports: [ChainService],
})
export class ChainModule {}
