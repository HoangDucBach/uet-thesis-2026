import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { RelayConfigService } from '../config/relay-config.service';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
@Injectable()
export class ChainService implements OnModuleInit {
  private readonly logger = new Logger(ChainService.name);
  private client: SuiGrpcClient;
  private keypair: Ed25519Keypair;

  constructor(private readonly config: RelayConfigService) {}

  onModuleInit() {
    try {
      const privateKey = this.config.getPrivateKey();
      this.keypair = Ed25519Keypair.fromSecretKey(privateKey);
      this.logger.log('Keypair initialized');

      const network = this.config.getNetwork();
      const baseUrl = this.config.getRpcUrl() || getJsonRpcFullnodeUrl(network);
      this.client = new SuiGrpcClient({
        baseUrl,
        network,
      });
      this.logger.log(`Connected to Sui ${network} network`);
    } catch (error) {
      this.logger.error('Failed to initialize chain service', error);
      throw error;
    }
  }

  public getClient(): SuiGrpcClient {
    return this.client;
  }

  public getKeypair(): Ed25519Keypair {
    return this.keypair;
  }
}
