import { Network } from 'src/common';
import { COW_DEX, DEEPBOOK } from 'src/contracts/constants';

import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RelayConfigService {
  constructor(private readonly configService: ConfigService) {}

  getNetwork(): Network {
    const network = this.configService.get<string>('NETWORK', 'testnet');
    return network as Network;
  }

  getPrivateKey(): string {
    const key = this.configService.get<string>('ADMIN_PRIVATE_KEY');
    if (!key) {
      throw new Error(
        'ADMIN_PRIVATE_KEY is required but not set in environment variables',
      );
    }
    return key;
  }

  getRpcUrl(): string | undefined {
    return getJsonRpcFullnodeUrl(this.getNetwork());
  }

  getCowDexPackageId(): string {
    const packageId = this.configService.get<string>(COW_DEX.PACKAGE_ID_ENV);
    if (!packageId) {
      throw new Error(
        `${COW_DEX.PACKAGE_ID_ENV} is required but not set in environment variables`,
      );
    }
    return packageId;
  }

  getDeepbookPackageId(): string | undefined {
    return this.configService.get<string>(DEEPBOOK.PACKAGE_ID_ENV);
  }

  getDeepbookRegistryId(): string | undefined {
    return this.configService.get<string>(DEEPBOOK.REGISTRY_ID_ENV);
  }

  getGlobalConfigId(): string {
    const configId = this.configService.get<string>('GLOBAL_CONFIG_ID');
    if (!configId) {
      throw new Error(
        'GLOBAL_CONFIG_ID is required but not set in environment variables',
      );
    }
    return configId;
  }

  getGrpcHost(): string {
    return this.configService.get<string>('GRPC_HOST', 'localhost');
  }

  getGrpcPort(): number {
    return this.configService.get<number>('GRPC_PORT', 50051);
  }
}
