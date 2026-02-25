import { IntentCreatedEventType } from 'src/common/contracts';

export interface BatchInput {
  intents: IntentCreatedEventType[];
  batchId: string;
}

export interface BatchOpenResult {
  /** Local string handle used before on-chain batch_id is known */
  localBatchId: string;
  /** Canonical on-chain batch id from BatchOpenedEvent */
  onChainBatchId: bigint;
  auctionStateId: string;
  txDigest: string;
  commitEndTime: bigint;
  executeDeadlineTime: bigint;
  timestamp: number;
}

export interface BatchStatus {
  localBatchId: string;
  onChainBatchId?: bigint;
  auctionStateId?: string;
  status:
    | 'pending'
    | 'opened'
    | 'committed'
    | 'executing'
    | 'settled'
    | 'failed';
  txDigest?: string;
  intentCount: number;
  openedAt?: number;
  settledAt?: number;
  error?: string;
}
