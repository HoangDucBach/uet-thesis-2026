import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Network } from 'src/common';
import { DEEPBOOK, COW_DEX } from 'src/contracts/constants';

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

  getDeepbookPackageId(): string {
    const packageId = this.configService.get<string>(DEEPBOOK.PACKAGE_ID_ENV);
    if (!packageId) {
      throw new Error(
        `${DEEPBOOK.PACKAGE_ID_ENV} is required but not set in environment variables`,
      );
    }
    return packageId;
  }

  getDeepbookRegistryId(): string {
    const registryId = this.configService.get<string>(DEEPBOOK.REGISTRY_ID_ENV);
    if (!registryId) {
      throw new Error(
        `${DEEPBOOK.REGISTRY_ID_ENV} is required but not set in environment variables`,
      );
    }
    return registryId;
  }
}
