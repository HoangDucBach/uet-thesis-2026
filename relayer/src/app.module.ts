import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';
import { ConfigModule } from './config/config.module';
import { ContractModule } from './contracts/contract.module';
import { KeeperModule } from './keeper/keeper.module';
import { ScannerModule } from './scanner/scanner.module';
import { ChainModule } from './chain/chain.module';

@Module({
  imports: [
    CacheModule, // @Global — available to all modules
    ConfigModule,
    ContractModule,
    KeeperModule,
    ScannerModule,
    ChainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
