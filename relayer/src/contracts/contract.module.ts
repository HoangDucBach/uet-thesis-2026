import { ConfigModule as RelayConfigModule } from 'src/config/config.module';

import { Module } from '@nestjs/common';

import { ContractConfigService } from './contract-config.service';

@Module({
  imports: [RelayConfigModule],
  providers: [ContractConfigService],
  exports: [ContractConfigService],
})
export class ContractModule {}
