export interface IntentEvent {
  id: string;
  owner: string;
  sellAmount: bigint;
  minAmountOut: bigint;
  deadline: bigint;
  txDigest: string;
  eventSeq: number;
  timestamp: number;
}

export interface Cursor {
  txDigest: string;
  eventSeq: number;
}

export interface PollResult {
  data: IntentEvent[];
  nextCursor?: Cursor;
}
