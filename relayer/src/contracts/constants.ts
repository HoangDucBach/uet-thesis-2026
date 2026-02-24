/**
 * Smart Contract Constants
 *
 * Module, type, function, and event definitions with full qualified names
 * Pattern: {package_id}::module_name::item_name
 */

// ============================================================================
// DEEPBOOK V3 - Decentralized Orderbook & Market Maker
// ============================================================================

export const DEEPBOOK = {
  // Environment variable key
  PACKAGE_ID_ENV: 'DEEPBOOK_PACKAGE_ID',
  REGISTRY_ID_ENV: 'DEEPBOOK_REGISTRY_ID',

  // Module name
  MODULE_NAME: 'deepbook',

  // Build full qualified name: {packageId}::module::item
  qualified: (packageId: string, item: string) =>
    `${packageId}::${DEEPBOOK.MODULE_NAME}::${item}`,

  // Shared Objects
  REGISTRY: 'Registry',

  // Types
  TYPES: {
    POOL: 'Pool',
    ACCOUNT: 'Account',
    ORDER: 'Order',
  },

  // Events
  EVENTS: {
    POOL_CREATED: 'PoolCreatedEvent',
    SWAP: 'SwapEvent',
    ADD_LIQUIDITY: 'AddLiquidityEvent',
    REMOVE_LIQUIDITY: 'RemoveLiquidityEvent',
  },

  // Public Functions
  FUNCTIONS: {
    CREATE_POOL: 'create_pool',
    SWAP: 'swap',
    ADD_LIQUIDITY: 'add_liquidity',
    REMOVE_LIQUIDITY: 'remove_liquidity',
  },
} as const;

// ============================================================================
// COW DEX - Batch Auctions for MEV-Free Trading
// ============================================================================

export const COW_DEX = {
  // Environment variable key
  PACKAGE_ID_ENV: 'COW_DEX_PACKAGE_ID',

  // Module name
  MODULE_NAME: 'cow_dex',

  // Build full qualified name: {packageId}::module::item
  qualified: (packageId: string, item: string) =>
    `${packageId}::${COW_DEX.MODULE_NAME}::${item}`,

  // Types
  TYPES: {
    BATCH: 'Batch',
    INTENT: 'Intent',
  },

  // Events
  EVENTS: {
    BATCH_CREATED: 'BatchCreatedEvent',
    BATCH_SETTLED: 'BatchSettledEvent',
    SOLVER_COMMITTED: 'SolverCommittedEvent',
  },

  // Public Functions
  FUNCTIONS: {
    CREATE_BATCH: 'create_batch',
    COMMIT_SOLUTION: 'commit_solution',
    EXECUTE_SOLUTION: 'execute_solution',
  },
} as const;

// ============================================================================
// INTENT BOOK - User Swap Intents
// ============================================================================

export const INTENT_BOOK = {
  // Environment variable key
  PACKAGE_ID_ENV: 'COW_DEX_PACKAGE_ID',

  // Module name
  MODULE_NAME: 'intent_book',

  // Build full qualified name: {packageId}::module::item
  qualified: (packageId: string, item: string) =>
    `${packageId}::${INTENT_BOOK.MODULE_NAME}::${item}`,

  // Types
  TYPES: {
    INTENT: 'Intent',
    INTENT_CAP: 'IntentCap',
  },

  // Events
  EVENTS: {
    INTENT_CREATED: 'IntentCreatedEvent',
    INTENT_CANCELLED: 'IntentCancelledEvent',
  },

  // Public Functions
  FUNCTIONS: {
    CREATE_INTENT: 'create_intent',
    CANCEL_INTENT: 'cancel_intent',
    SETTLE_INTENT: 'settle_intent',
  },
} as const;

// ============================================================================
// SETTLEMENT - Protocol Settlement & Clearing
// ============================================================================

export const SETTLEMENT = {
  // Environment variable key
  PACKAGE_ID_ENV: 'COW_DEX_PACKAGE_ID',

  // Module name
  MODULE_NAME: 'settlement',

  // Build full qualified name: {packageId}::module::item
  qualified: (packageId: string, item: string) =>
    `${packageId}::${SETTLEMENT.MODULE_NAME}::${item}`,

  // Types
  TYPES: {
    AUCTION_STATE: 'AuctionState',
    SETTLEMENT_TICKET: 'SettlementTicket',
    COMMIT_ENTRY: 'CommitEntry',
    AUCTION_PHASE: 'AuctionPhase',
  },

  // Events
  EVENTS: {
    WINNER_SELECTED: 'WinnerSelectedEvent',
    SETTLEMENT_COMPLETE: 'SettlementCompleteEvent',
    FALLBACK_TRIGGERED: 'FallbackTriggeredEvent',
  },

  // Public Functions
  FUNCTIONS: {
    OPEN_BATCH: 'open_batch',
    OPEN_BATCH_AND_SHARE: 'open_batch_and_share',
    COMMIT: 'commit',
    CLOSE_COMMITS: 'close_commits',
    OPEN_SETTLEMENT: 'open_settlement',
    PROCESS_INTENT: 'process_intent',
    CLOSE_SETTLEMENT: 'close_settlement',
    TRIGGER_FALLBACK: 'trigger_fallback',
    CLAIM_REFUND: 'claim_refund',
  },
} as const;

// ============================================================================
// CONFIG - Protocol Configuration
// ============================================================================

export const CONFIG = {
  // Environment variable key
  PACKAGE_ID_ENV: 'COW_DEX_PACKAGE_ID',

  // Module name
  MODULE_NAME: 'config',

  // Build full qualified name: {packageId}::module::item
  qualified: (packageId: string, item: string) =>
    `${packageId}::${CONFIG.MODULE_NAME}::${item}`,

  // Types
  TYPES: {
    GLOBAL_CONFIG: 'GlobalConfig',
    ADMIN_CAP: 'AdminCap',
  },

  // Events
  EVENTS: {
    CONFIG_UPDATED: 'ConfigUpdatedEvent',
    MIN_BOND_UPDATED: 'MinBondUpdatedEvent',
    PROTOCOL_FEE_UPDATED: 'ProtocolFeeUpdatedEvent',
  },

  // Public Functions
  FUNCTIONS: {
    INITIALIZE: 'initialize',
    UPDATE_MIN_BOND: 'update_min_bond',
    UPDATE_PROTOCOL_FEE: 'update_protocol_fee',
  },
} as const;

// ============================================================================
// Export all module configs
// ============================================================================

export const MODULES = {
  DEEPBOOK,
  COW_DEX,
  INTENT_BOOK,
  SETTLEMENT,
  CONFIG,
} as const;
