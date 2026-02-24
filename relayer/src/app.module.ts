import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ContractModule } from './contracts/contract.module';
import { KeeperModule } from './keeper/keeper.module';
import { ScannerModule } from './scanner/scanner.module';
import { ChainModule } from './chain/chain.module';

@Module({
  imports: [
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
