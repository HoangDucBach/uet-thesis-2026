import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { RelayConfigService } from './relay-config.service';

@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true })],
  providers: [RelayConfigService],
  exports: [RelayConfigService],
})
export class ConfigModule {}
