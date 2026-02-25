import { IntentCreatedEventType } from 'src/common/contracts';

export interface BatchInput {
  intents: IntentCreatedEventType[];
  batchId: string;
}

export interface BatchOpenResult {
  batchId: string;
  txDigest: string;
  commitEndTime: bigint;
  executeDeadlineTime: bigint;
  timestamp: number;
}

export interface BatchStatus {
  batchId: string;
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
