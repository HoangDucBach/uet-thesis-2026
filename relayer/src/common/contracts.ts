// public struct IntentCreatedEvent has copy, drop {
//     intent_id: ID,
//     owner: address,
//     sell_type: TypeName,
//     buy_type: TypeName,
//     sell_amount: u64,
//     min_amount_out: u64,
//     deadline: u64,
// }

import { bcs } from '@mysten/bcs';

export const TypeName = bcs.struct('TypeName', {
  name: bcs.string(),
});

export const IntentCreatedEvent = bcs.struct('IntentCreatedEvent', {
  intent_id: bcs.string(),
  owner: bcs.string(),
  sell_type: TypeName,
  buy_type: TypeName,
  sell_amount: bcs.u64(),
  min_amount_out: bcs.u64(),
  deadline: bcs.u64(),
});

export type IntentCreatedEventType = typeof IntentCreatedEvent.$inferType;
