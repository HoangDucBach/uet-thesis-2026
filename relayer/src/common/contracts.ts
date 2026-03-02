import { bcs, fromHex, toHex } from '@mysten/bcs';

export const TypeName = bcs.struct('TypeName', {
  name: bcs.string(),
});

const Address = bcs.fixedArray(32, bcs.u8()).transform({
  input: (id: string) => fromHex(id.replace('0x', '')),
  output: (id) => `0x${toHex(Uint8Array.from(id))}`,
});

export const IntentCreatedEvent = bcs.struct('IntentCreatedEvent', {
  intent_id: Address,
  owner: Address,
  sell_type: TypeName,
  buy_type: TypeName,
  sell_amount: bcs.u64(),
  min_amount_out: bcs.u64(),
  deadline: bcs.u64(),
});

export type IntentCreatedEventType = typeof IntentCreatedEvent.$inferType;

export const BatchOpenedEvent = bcs.struct('BatchOpenedEvent', {
  batch_id: bcs.u64(),
  auction_state_id: Address,
  intent_ids: bcs.vector(Address),
  commit_end_ms: bcs.u64(),
  execute_deadline_ms: bcs.u64(),
});

export type BatchOpenedEventType = typeof BatchOpenedEvent.$inferType;

export const WinnerSelectedEvent = bcs.struct('WinnerSelectedEvent', {
  batch_id: bcs.u64(),
  winner: bcs.string(),
  winner_score: bcs.u64(),
  runner_up: bcs.option(bcs.string()),
  runner_up_score: bcs.u64(),
});

export type WinnerSelectedEventType = typeof WinnerSelectedEvent.$inferType;

export const SettlementCompleteEvent = bcs.struct('SettlementCompleteEvent', {
  batch_id: bcs.u64(),
  winner: bcs.string(),
  actual_cow_pairs: bcs.u64(),
  committed_score: bcs.u64(),
});

export type SettlementCompleteEventType =
  typeof SettlementCompleteEvent.$inferType;

export const FallbackTriggeredEvent = bcs.struct('FallbackTriggeredEvent', {
  batch_id: bcs.u64(),
  winner: bcs.string(),
  bond_slashed: bcs.u64(),
});

export type FallbackTriggeredEventType =
  typeof FallbackTriggeredEvent.$inferType;
