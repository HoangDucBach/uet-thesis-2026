import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { RelayConfigService } from './relay-config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
    }),
  ],
  providers: [RelayConfigService],
  exports: [RelayConfigService],
})
export class ConfigModule {}
