export interface IntentEvent {
  id: string;
  owner: string;
  sellAmount: bigint;
  minAmountOut: bigint;
  deadline: bigint;
  txDigest: string;
  eventSeq: number;
  timestamp: number;
  eventBcs?: string;
}

export interface PollResult {
  data: IntentEvent[];
  nextCursor?: string;
}
