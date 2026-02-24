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
    POOL_CREATED: 'PoolCreated',
    SWAP: 'Swap',
    ADD_LIQUIDITY: 'AddLiquidity',
    REMOVE_LIQUIDITY: 'RemoveLiquidity',
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
    BATCH_CREATED: 'BatchCreated',
    BATCH_SETTLED: 'BatchSettled',
    SOLVER_COMMITTED: 'SolverCommitted',
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
    INTENT_CREATED: 'IntentCreated',
    INTENT_CANCELLED: 'IntentCancelled',
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
  },

  // Events
  EVENTS: {
    AUCTION_CREATED: 'AuctionCreated',
    WINNER_SELECTED: 'WinnerSelected',
    SETTLEMENT_COMPLETE: 'SettlementComplete',
    FALLBACK_TRIGGERED: 'FallbackTriggered',
  },

  // Public Functions
  FUNCTIONS: {
    CREATE_AUCTION: 'create_auction',
    COMMIT_SOLUTION: 'commit_solution',
    SELECT_WINNER: 'select_winner',
    SETTLE_AUCTION: 'settle_auction',
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
    CONFIG_UPDATED: 'ConfigUpdated',
    MIN_BOND_UPDATED: 'MinBondUpdated',
    PROTOCOL_FEE_UPDATED: 'ProtocolFeeUpdated',
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
