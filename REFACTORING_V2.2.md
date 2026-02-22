# Refactoring to v2.2: Score-Commit Auction (No Reveal Phase)

## Overview

v2.2 removes the reveal phase entirely and simplifies the commitment mechanism. Instead of committing to a hash of the full solution, solvers now commit directly to a **score** (number of CoW pairs) during the Commit phase. The winner is selected on-the-fly by highest score (with earliest timestamp as tiebreaker).

## Key Changes

### 1. AuctionPhase Enum

**Before (v2.1):**
```move
public enum AuctionPhase has copy, drop, store {
    Commit,
    Reveal,
    Execute,
    Done,
}
```

**After (v2.2):**
```move
public enum AuctionPhase has copy, drop, store {
    Commit,
    Execute,
    Done,
    Failed,  // New: for fallback after grace period
}
```

- Removed `Reveal` phase entirely
- Added `Failed` phase for fallback execution

### 2. CommitEntry Struct

**Before (v2.1):**
```move
public struct CommitEntry has store {
    commitment: vector<u8>,  // Keccak256(solution || nonce)
    bond: Balance<SUI>,
    timestamp: u64,
}
```

**After (v2.2):**
```move
public struct CommitEntry has store {
    score: u64,              // Number of CoW pairs committed
    bond: Balance<SUI>,
    timestamp: u64,
}
```

- Replaced cryptographic commitment hash with score (n_cow_pairs)
- Solver must deliver exactly this many CoW pairs or loses bond

### 3. AuctionState Struct

**Before (v2.1):**
```move
public struct AuctionState has key, store {
    // ... other fields ...
    reveal_end_ms: u64,
    commits: Table<address, CommitEntry>,
    best_solution: Option<RevealedSolution>,
    winner: Option<address>,
}
```

**After (v2.2):**
```move
public struct AuctionState has key, store {
    // ... other fields ...
    grace_end_ms: u64,  // New: deadline for winner execution
    commits: Table<address, CommitEntry>,
    winner: Option<address>,
    actual_cow_pairs: u64,  // New: counter populated during execute
}
```

- Removed `reveal_end_ms` and `best_solution`
- Added `grace_end_ms` for execution deadline
- Added `actual_cow_pairs` counter for execution verification

### 4. Function Changes

#### Removed Functions
- `reveal()` - No longer needed (no reveal phase)
- `settle()` - Replaced with execution flow
- Helper functions: `verify_solution_outputs()`, `solution_to_bytes()`
- Solution getters: `solution_solver()`, `solution_cow_pairs()`, etc.

#### Updated Functions

**`new_auction()` → `open_batch()`**
- Simplified signature (no reveal_duration parameter)
- Sets: `commit_end_ms = now + 2000ms`, `grace_end_ms = commit_end_ms + 5000ms`

**`commit()`**
```move
public fun commit(
    state: &mut AuctionState,
    score: u64,              // Score instead of commitment hash
    bond: Balance<SUI>,
    clock: &Clock,
    ctx: &TxContext,
)
```
- Accepts score parameter (n_cow_pairs)
- Winner selected on-the-fly: highest score wins
- Tiebreaker: earliest timestamp wins

#### New Functions

**`close_commits()`**
- Transitions from Commit to Execute phase
- Called after `commit_end_ms`
- Winner already selected during Commit phase

**`verify_and_transfer()`**
```move
public fun verify_and_transfer(
    state: &mut AuctionState,
    actual_output: u64,
    min_required: u64,
    clearing_price: u64,
)
```
- Called per CoW pair during Execute phase
- Verifies: `actual_output >= min_required` (user protection)
- Verifies: `actual_output >= clearing_price` (EBBO floor check)
- Increments `actual_cow_pairs` counter
- **Known Limitation**: Assumes mid-price stability over 5s; spot price volatility may cause false positives

**`finalize_and_check()`**
```move
public fun finalize_and_check(
    state: &mut AuctionState,
    flash_receipt: FlashLoan,
)
```
- Verifies: `actual_cow_pairs >= committed_score`
- Consumes FlashLoan Hot Potato (enforces flash loan repayment)
- Transitions to Done phase
- Must be last command in settlement PTB before flash_repay

**`trigger_fallback()`**
```move
public fun trigger_fallback(state: &mut AuctionState, clock: &Clock)
```
- Called if winner fails to execute within grace period
- Slashes winner's bond (held in state)
- Transitions to Failed phase

### 5. Execution Flow (v2.2)

```
1. open_batch()
   ├─ Phase: Commit
   ├─ commit_end_ms = now + 2000ms
   └─ grace_end_ms = commit_end_ms + 5000ms

2. Multiple commit() calls
   ├─ Solver submits: score + bond
   ├─ Winner selected on-the-fly (highest score)
   └─ Timestamp stored for tiebreaker

3. close_commits()
   └─ Phase: Commit → Execute

4. verify_and_transfer() (per CoW pair)
   ├─ Check output >= min_required
   ├─ Check output >= clearing_price (EBBO floor)
   └─ Increment actual_cow_pairs

5. Either:
   A. finalize_and_check() [Success path]
      ├─ Verify: actual_cow_pairs >= committed_score
      ├─ Consume FlashLoan Hot Potato
      └─ Phase: Done

   B. trigger_fallback() [Failure path after grace_end_ms]
      └─ Phase: Failed (bond slashed)
```

### 6. Storage Optimizations

- **Eliminated reveal phase** → no solution storage needed
- **Score-based commitment** → single u64 instead of 32-byte hash
- **On-the-fly winner selection** → no best_solution tracking
- **Result**: Reduced state bloat, faster phase transitions

### 7. Security Model

| Aspect | v2.1 | v2.2 |
|--------|------|------|
| **Commitment** | Cryptographic hash | Score (u64) |
| **Verification** | Off-chain reveal + verification | On-chain output checking + finalize |
| **Solver Guarantee** | Reveal before deadline | Deliver all committed CoW pairs |
| **Punishment** | No reveal → bond held | Score mismatch → finalize fails (PTB reverts) |
| **Fallback** | N/A | Slash bond after grace period |

## Migration Checklist

- [x] Remove `Reveal` phase from AuctionPhase enum
- [x] Update CommitEntry to store score instead of commitment hash
- [x] Update AuctionState fields (remove reveal_end_ms, best_solution, add grace_end_ms, actual_cow_pairs)
- [x] Implement open_batch() replacing new_auction()
- [x] Update commit() to accept score and select winner on-the-fly
- [x] Implement close_commits() for phase transition
- [x] Implement verify_and_transfer() for per-pair output verification
- [x] Implement finalize_and_check() for score enforcement and Hot Potato consumption
- [x] Implement trigger_fallback() for grace period expiration
- [x] Remove reveal() function
- [x] Remove old solution getters and helpers
- [x] Verify compilation with no warnings

## Off-Chain Changes Required

### Solver Driver
1. Remove RevealManager (no reveal phase)
2. Simplify flow: `commit score → watch WinnerSelectedEvent → build settlement PTB`
3. Add score calculation during Engine phase (count n_cow_pairs)
4. Build settlement PTB with verify_and_transfer() calls
5. Call finalize_and_check() before flash_repay

### Relay Server
1. Track committed scores per solver
2. Emit WinnerSelectedEvent after commit_end_ms
3. No reveal storage needed

### Benchmarking
- H1-H5 hypotheses can still be validated using metrics
- No change to metrics collection needed

## Constants

- `COMMIT_DURATION_MS = 2000` - Commit phase duration
- `GRACE_PERIOD_MS = 5000` - Grace period for execution before fallback
- `MIN_BOND = 1_000_000_000` - 1 SUI (configurable per deployment)

## Files Changed

- `settlement.move` - Complete redesign of auction state machine and functions
- No changes to `intent_book.move` (v2.1 Light Registry unchanged)
- No changes to `metrics.move` (event structure unchanged)

## Rationale

**Why remove the reveal phase?**
1. **Latency**: 2-phase auction (Commit + Reveal) → 1-phase auction (Commit directly)
2. **Complexity**: Cryptographic reveal logic eliminated
3. **Storage**: No solution storage needed on-chain
4. **Cryptoeconomics**: Direct score commitment + bond guarantee same security with simpler code

**Why score-only commitment?**
- Solver must have real CoW pairs to fulfill score
- If actual_cow_pairs < committed_score, finalize_and_check() fails
- PTB reversion provides atomic failure guarantee
- More trustless than off-chain reveal verification
