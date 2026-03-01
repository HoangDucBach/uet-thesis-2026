import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';

/**
 * @Global() — registered once in AppModule.
 * All other modules can inject CacheService without importing CacheModule.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
