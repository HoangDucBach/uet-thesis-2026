import { Injectable } from '@nestjs/common';
import { RelayConfigService } from 'src/config/relay-config.service';
import {
  DEEPBOOK,
  COW_DEX,
  INTENT_BOOK,
  SETTLEMENT,
  CONFIG,
} from './constants';

/**
 * Contract Configuration Service
 *
 * Provides centralized access to contract package IDs, module names,
 * and qualified names for types, events, and functions.
 *
 * Caches package IDs from environment variables for efficiency.
 */
@Injectable()
export class ContractConfigService {
  private deepbookPackageId: string | undefined;
  private cowDexPackageId: string;
  private deepbookRegistryId: string | undefined;

  constructor(private relayConfig: RelayConfigService) {
    this.deepbookPackageId = this.relayConfig.getDeepbookPackageId();
    this.cowDexPackageId = this.relayConfig.getCowDexPackageId();
    this.deepbookRegistryId = this.relayConfig.getDeepbookRegistryId();
  }

  // ========================================================================
  // DEEPBOOK
  // ========================================================================

  getDeepbookPackageId(): string {
    if (!this.deepbookPackageId) {
      throw new Error('DEEPBOOK_PACKAGE_ID is not set');
    }
    return this.deepbookPackageId;
  }

  getDeepbookRegistryId(): string {
    if (!this.deepbookRegistryId) {
      throw new Error('DEEPBOOK_REGISTRY_ID is not set');
    }
    return this.deepbookRegistryId;
  }

  getDeepbookQualified(item: string): string {
    return DEEPBOOK.qualified(this.getDeepbookPackageId(), item);
  }

  getDeepbookType(typeKey: keyof typeof DEEPBOOK.TYPES): string {
    return this.getDeepbookQualified(DEEPBOOK.TYPES[typeKey]);
  }

  getDeepbookEvent(eventKey: keyof typeof DEEPBOOK.EVENTS): string {
    return this.getDeepbookQualified(DEEPBOOK.EVENTS[eventKey]);
  }

  getDeepbookFunction(funcKey: keyof typeof DEEPBOOK.FUNCTIONS): string {
    return this.getDeepbookQualified(DEEPBOOK.FUNCTIONS[funcKey]);
  }

  // ========================================================================
  // COW DEX
  // ========================================================================

  getCowDexPackageId(): string {
    return this.cowDexPackageId;
  }

  getCowDexQualified(item: string): string {
    return COW_DEX.qualified(this.cowDexPackageId, item);
  }

  getCowDexType(typeKey: keyof typeof COW_DEX.TYPES): string {
    return this.getCowDexQualified(COW_DEX.TYPES[typeKey]);
  }

  getCowDexEvent(eventKey: keyof typeof COW_DEX.EVENTS): string {
    return this.getCowDexQualified(COW_DEX.EVENTS[eventKey]);
  }

  getCowDexFunction(funcKey: keyof typeof COW_DEX.FUNCTIONS): string {
    return this.getCowDexQualified(COW_DEX.FUNCTIONS[funcKey]);
  }

  // ========================================================================
  // INTENT BOOK
  // ========================================================================

  getIntentBookType(typeKey: keyof typeof INTENT_BOOK.TYPES): string {
    return INTENT_BOOK.qualified(
      this.cowDexPackageId,
      INTENT_BOOK.TYPES[typeKey],
    );
  }

  getIntentBookEvent(eventKey: keyof typeof INTENT_BOOK.EVENTS): string {
    return INTENT_BOOK.qualified(
      this.cowDexPackageId,
      INTENT_BOOK.EVENTS[eventKey],
    );
  }

  getIntentBookFunction(funcKey: keyof typeof INTENT_BOOK.FUNCTIONS): string {
    return INTENT_BOOK.qualified(
      this.cowDexPackageId,
      INTENT_BOOK.FUNCTIONS[funcKey],
    );
  }

  // ========================================================================
  // SETTLEMENT
  // ========================================================================

  getSettlementType(typeKey: keyof typeof SETTLEMENT.TYPES): string {
    return SETTLEMENT.qualified(
      this.cowDexPackageId,
      SETTLEMENT.TYPES[typeKey],
    );
  }

  getSettlementEvent(eventKey: keyof typeof SETTLEMENT.EVENTS): string {
    return SETTLEMENT.qualified(
      this.cowDexPackageId,
      SETTLEMENT.EVENTS[eventKey],
    );
  }

  getSettlementFunction(funcKey: keyof typeof SETTLEMENT.FUNCTIONS): string {
    return SETTLEMENT.qualified(
      this.cowDexPackageId,
      SETTLEMENT.FUNCTIONS[funcKey],
    );
  }

  // ========================================================================
  // CONFIG
  // ========================================================================

  getConfigType(typeKey: keyof typeof CONFIG.TYPES): string {
    return CONFIG.qualified(this.cowDexPackageId, CONFIG.TYPES[typeKey]);
  }

  getConfigEvent(eventKey: keyof typeof CONFIG.EVENTS): string {
    return CONFIG.qualified(this.cowDexPackageId, CONFIG.EVENTS[eventKey]);
  }

  getConfigFunction(funcKey: keyof typeof CONFIG.FUNCTIONS): string {
    return CONFIG.qualified(this.cowDexPackageId, CONFIG.FUNCTIONS[funcKey]);
  }
}
