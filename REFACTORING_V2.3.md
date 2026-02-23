# Refactoring to v2.3: Shared Intent Object + SettlementTicket Hot Potato

## Executive Summary

v2.3 is a fundamental architectural redesign that eliminates the on-chain IntentRegistry and off-chain relay dependency. **User coins are now locked in shared Intent<T> objects on-chain at creation time**. Replay protection leverages Sui's linear type system: Intent deletion in `consume_intent()` makes double-settlement impossible at the VM level.

The new **SettlementTicket Hot Potato** pattern enforces settlement completion via the Move type system (compile-time), not runtime checks. Settlement becomes trustless and decentralized without needing centralized relay infrastructure.

## Version Progression

```
v2.0 → v2.1 → v2.2 → v2.3

v2.0: Full on-chain IntentRecord + nonce registry
v2.1: Light Registry (nonce-only) + off-chain intent relay
v2.2: Score-commit auction (no reveal phase)
v2.3: Shared Intent object + compile-time settlement guarantee (CURRENT)
```

## Key Architecture Changes

### 1. Intent Storage Model

| Aspect | v2.1 (Light Registry) | v2.3 (Shared Intent) |
|--------|----------------------|----------------------|
| Intent location | Off-chain in Relay | On-chain, shared object |
| Coin custody | User wallet | Locked in Intent.sell_balance |
| Replay protection | Nonce registry (on-chain) | Object deletion (Sui VM) |
| Discovery method | REST API / webhook | IntentCreatedEvent |
| Scalability | Relay bottleneck | Parallel object creation |

**v2.3 Benefit**: Users control when coins are locked (atomically on-chain). No centralized relay required. Solver discovers via blockchain events, not API.

### 2. Settlement Guarantee Mechanism

| Aspect | v2.2 (verify_and_transfer) | v2.3 (SettlementTicket) |
|--------|---------------------------|--------------------------|
| Winner enforcement | Runtime checks | Compile-time type system |
| Settlement completeness | Runtime revert if outputs < min | PTB validation fails if ticket not consumed |
| Guarantee level | Runtime, can be bypassed | Type-system level, impossible to bypass |
| Flash repayment | Hot Potato (no abilities) | Still Hot Potato, but integrated with settlement ticket |
| Atomicity | Per-pair verification | Atomic: Intent deleted, payout transferred |

**v2.3 Benefit**: Settlement completion enforced at bytecode validation before execution. No runtime vulnerabilities.

### 3. Replay Protection Comparison

**v2.1 (Nonce Registry)**:
```move
user_nonces: Table<address, u64>
verify_nonce(user, expected_nonce)  // On-chain check
nonce += 1  // Increment atomically
```
**Problem**: Nonce writes bottleneck at intake time (all users share one table).

**v2.3 (Object Deletion)**:
```move
Intent<T> { id: UID, ... }
consume_intent(intent: Intent<T>)  // Takes by value
  object::delete(id)  // Shared object deleted
  // Sui linear type system: deleted object cannot be referenced
```
**Benefit**: Each Intent is independent shared object. Deletion is irreversible at VM level. Zero nonce overhead.

## Data Flow Comparison

### v2.1 Flow
```
User signs intent JSON
  → Relay broadcasts event
  → Solver calls verify_and_consume_intent(registry, ...) inside PTB
  → Nonce incremented
  → Intent data from event used in settlement
```

### v2.3 Flow
```
User calls create_intent(coin, min_out, deadline, clock)
  → Coin locked in Intent<T> shared object
  → IntentCreatedEvent broadcast (on-chain)
  → Solver calls process_intent(ticket, Intent, payout, min, floor)
  → Intent deleted (consume_intent → object::delete(id))
  → Replay impossible (deleted object cannot be referenced)
```

## Structs: Before and After

### intent_book.move

**v2.1 (Light Registry)**:
```move
pub struct IntentRegistry has key {
    id: UID,
    user_nonces: Table<address, u64>,
    version: u64,
}
```

**v2.3 (Shared Intent + Cap)**:
```move
pub struct Intent<phantom T> has key {
    id: UID,
    batch_id: Option<u64>,
    owner: address,
    sell_balance: Balance<T>,  // ← User's coins locked here
    sell_amount: u64,
    buy_type: TypeName,
    min_amount_out: u64,
    deadline: u64,
}

pub struct IntentCap has key, store {
    id: UID,
    intent_id: ID,  // ← Proves ownership for cancel
}
```

### settlement.move

**v2.2 (verify_and_transfer)**:
```move
pub fun verify_and_transfer<T>(
    state: &mut AuctionState,
    actual_output: u64,
    min_required: u64,
    clearing_price: u64,
) {
    // Increment actual_cow_pairs in state
    // No Intent consumption
}
```

**v2.3 (SettlementTicket Hot Potato)**:
```move
pub struct SettlementTicket {  // ← No abilities (drop/store/key/copy)
    batch_id: u64,
    committed_score: u64,
    actual_cow_pairs: u64,
}

pub fun process_intent<T>(
    ticket: &mut SettlementTicket,
    intent: Intent<T>,  // ← Taken by value
    payout: Coin<T>,
    min_required: u64,
    ebbo_floor: u64,
    ctx: &mut TxContext,
) {
    // 1. Verify EBBO floor
    // 2. consume_intent(intent) → object::delete(id)
    // 3. Transfer payout to user
    // 4. ticket.actual_cow_pairs += 1
}
```

**Key Difference**: `Intent` is taken by **value** and deleted atomically. Move's linear type system guarantees this is irreversible.

## Function Changes

### Removed Functions
- `intent_book::verify_and_consume_intent()` — Signature verification no longer needed
- `intent_book::new()` — IntentRegistry not created anymore
- `intent_book::user_nonce()` — No nonce registry
- `settlement::verify_and_transfer()` — Replaced with `process_intent()`
- `settlement::settle()` — Replaced with `open_settlement()`, `process_intent()`, `close_settlement()`

### New Functions

**intent_book.move**:
- `create_intent<T>()` — User creates intent, locks coin, returns IntentCap
- `cancel_intent<T>()` — User cancels before settlement, retrieves coins
- `consume_intent<T>()` — Called by settlement, deletes Intent, returns (owner, coins, min_out)

**settlement.move**:
- `open_settlement()` — Winner opens ticket (capability check)
- `process_intent<T>()` — Per-pair: consume Intent, verify EBBO, transfer payout, increment counter
- `close_settlement()` — Close ticket, verify committed_score, return bond
- `trigger_fallback()` — Slash bond if winner fails

## Settlement Process (v2.3 PTB)

```
cmd 1:   open_settlement(state) → ticket: SettlementTicket
         // Only winner can call (capability check)

cmd 2-N: process_intent(ticket, Intent_i, payout_i, min_i, floor_i) × N
         // Each Intent deleted atomically
         // Payout transferred to user
         // ticket.actual_cow_pairs incremented

cmd N+1: close_settlement(state, ticket)
         // actual_cow_pairs >= committed_score verified
         // ticket consumed (destroys it)
         // winner bond returned
         // SettlementCompleteEvent emitted
```

**Key Property**: If any `process_intent()` fails (EBBO check, amount mismatch, etc.), the entire PTB reverts. The SettlementTicket is never consumed, preventing partial settlements.

## EBBO Floor Check (v2.3)

```move
pub fun process_intent<T>(...) {
    let actual = coin::value(&payout);

    // Check 1: Meet user's minimum
    assert!(actual >= min_required, EOutputInsufficient);

    // Check 2: EBBO floor (user protection)
    // actual >= max(min_required, mid_price(DeepBook) × sell × 99/100)
    assert!(actual >= ebbo_floor, EClearingPriceMismatch);

    // ...proceed with settlement
}
```

**EBBO Floor Tolerance**: 1% discount allowed (99/100). Solver can clear at up to 1% worse than DeepBook mid.

**Known Limitation**: Mid-price at commit time ≠ mid-price at execute time (5s gap). Future: use TWAP instead.

## Comparison to v2.2

| Feature | v2.2 | v2.3 |
|---------|------|------|
| Intent storage | Off-chain + Light Registry nonce | On-chain shared Intent<T> |
| Replay protection | Nonce Table<address, u64> | Object deletion |
| Settlement guarantee | Runtime checks | Compile-time type system |
| Winner permission | Soft check (ENotWinner) | Capability check (ctx.sender == winner) |
| Intent consumption | Not consumed (lives in relay) | Taken by value, deleted (irreversible) |
| Code complexity | High (nonce management) | Low (linear types handle it) |
| Parallelism | Limited (nonce bottleneck) | High (each Intent independent) |

## Security Improvements

### Replay Protection

**v2.2**: Nonce incremented in `verify_and_consume_intent()`. If nonce increments but settlement fails, user can resubmit (with old nonce) → inconsistent state.

**v2.3**: Intent deleted in `consume_intent()`. Deleted object cannot be referenced. Sui VM enforces this at bytecode level. **Impossible to settle twice.**

### Settlement Completeness

**v2.2**: `verify_and_transfer()` per-pair. If some pairs execute and others revert, inconsistent final state (some coins transferred, others not). Solver can pick and choose which pairs to settle.

**v2.3**: SettlementTicket Hot Potato (no abilities). If any `process_intent()` fails, entire PTB reverts. **All-or-nothing atomicity enforced by type system.**

### Winner Permission

**v2.2**: Soft check `assert!(ctx.sender() == winner)`. Could be bypassed with cleverly constructed PTB.

**v2.3**: `open_settlement()` requires `ctx.sender() == winner`. SettlementTicket is only issued to winner, then required for all `process_intent()` calls. **Impossible to use ticket without being winner.**

## Events (v2.3)

**intent_book.move**:
```move
IntentCreatedEvent {
    intent_id: ID,
    owner: address,
    sell_type: TypeName,
    sell_amount: u64,
    buy_type: TypeName,
    min_amount_out: u64,
    deadline: u64,
}

IntentCancelledEvent {
    intent_id: ID,
    owner: address,
    sell_amount: u64,
}
```

**settlement.move**:
```move
WinnerSelectedEvent {
    batch_id: u64,
    winner: address,
    winner_score: u64,
    runner_up: Option<address>,
    runner_up_score: u64,
}

SettlementCompleteEvent {
    batch_id: u64,
    winner: address,
    actual_cow_pairs: u64,
    committed_score: u64,
}

FallbackTriggeredEvent {
    batch_id: u64,
    winner: address,
    bond_slashed: u64,
}
```

**Benefits**:
- Solver discovers intents from IntentCreatedEvent (no API)
- Winner selected on-chain, broadcast via WinnerSelectedEvent
- Settlement completion tracked via SettlementCompleteEvent
- Fallback tracked via FallbackTriggeredEvent

## Off-Chain Solver Impact

### v2.1 Driver
```typescript
1. Fetch intents from Relay REST API
2. Call verify_and_consume_intent() per intent in PTB
3. Signature verification happens on-chain
4. Nonce pre-check: query IntentRegistry
```

### v2.3 Driver
```typescript
1. Listen to IntentCreatedEvent on Sui blockchain
2. Call process_intent() per Intent in PTB
3. No signature verification (ownership proven by IntentCap)
4. No nonce pre-check (Intent deletion prevents replay)
5. Intent object passed to process_intent() directly
```

**Changes**:
- No need to validate signatures off-chain (Intent creation proves ownership)
- No need to track nonces (deletion-based replay protection)
- No Relay API dependency (blockchain as source of truth)
- Simpler error handling (all-or-nothing PTB revert)

## Backward Compatibility

**BREAKING**: v2.3 is not compatible with v2.1/v2.2 contracts. Requires:
- Redeployment of intent_book.move and settlement.move
- Solver stack rewrite (new event types, no verify_and_consume_intent call)
- User UX change: coins locked on-chain at creation (faster, more transparent)

## Migration Path (for future versions)

If v2.4 is needed, it can:
- Keep shared Intent<T> object model
- Enhance SettlementTicket with additional metrics
- Add multi-token settlement (currently single token per Intent)
- Implement intent bundling (group related intents)

## Deployment Checklist

- [x] intent_book.move: Shared Intent<T>, IntentCap, create/cancel/consume
- [x] settlement.move: SettlementTicket Hot Potato, open/process/close pattern
- [x] metrics.move: Updated events for v2.3
- [x] config.move: Unchanged (parameter management still relevant)
- [ ] Solver Driver: Listen to IntentCreatedEvent, call process_intent
- [ ] User UX: Explain coin locking on-chain
- [ ] Relay: Migrate from intent relay to event listener
- [ ] Tests: Replay attack tests, EBBO floor tests, Hot Potato enforcement tests

## Conclusion

v2.3 moves from a *relay-dependent, nonce-based* architecture to a *blockchain-native, deletion-based* architecture. The shared Intent object model and SettlementTicket Hot Potato pattern together eliminate entire classes of bugs:

- **Replay attacks**: Impossible (Intent deleted)
- **Partial settlement**: Impossible (all-or-nothing PTB)
- **Unauthorized settlement**: Impossible (SettlementTicket capability)
- **Nonce contention**: Eliminated (no nonce table)

The trade-off is user complexity: coins must be locked on-chain at creation time (not at settlement time). This is acceptable because:
1. User controls when to lock coins (clear intent creation UI)
2. Can cancel anytime before settlement (no forced lock period)
3. Transparent: coins visible on-chain (better security UX than off-chain relay)
4. Faster: no relay latency or double-submittal issues
