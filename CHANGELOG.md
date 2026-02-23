# Changelog

All notable changes to this project are documented in this file.

---

## v2.3 — Shared Intent Object + SettlementTicket Hot Potato

Fundamental redesign of intent model: removed `IntentRegistry` and off-chain intent entirely. User coins locked in shared `Intent<T>` object on-chain. Introduced `SettlementTicket` Hot Potato pattern ensuring only winner can process intents and must complete all obligations. Flash loan now optional solver choice, not protocol mechanism.

| #   | Section Affected               | Issue Found                                                                                                          | Correction Applied                                                                                                                                                                                                              |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15  | Section 5.1 `intent_book.move` | Off-chain intent + nonce model broken: Sui has no approve/pull mechanism. Solver cannot pull coins from user wallet. | Replaced with shared `Intent<T>` object. User locks coin inside object at creation. Coin available to winner solver via `process_intent()`. No pull needed.                                                                     |
| 16  | Section 5.1 `intent_book.move` | `IntentRegistry` (nonces) now unnecessary with shared Intent object model.                                           | Removed `IntentRegistry` entirely. Replay protection via Sui object deletion: `Intent` deleted in `process_intent()` → cannot be settled twice. Linear type system enforces this.                                               |
| 17  | Section 5.2 `settlement.move`  | `verify_and_transfer()` accepted `Coin` from solver — source unclear. Process flow fragmented.                       | Replaced with `SettlementTicket` Hot Potato pattern: `open_settlement()` issues ticket to winner only. `process_intent()` requires `&mut ticket` → only winner can call. `close_settlement()` consumes ticket + enforces score. |
| 18  | Section 5.2 `settlement.move`  | Flash loan was mandatory protocol mechanism — solver had no flexibility.                                             | Flash loan now solver's choice. Protocol only cares: user receives payout >= EBBO floor, `actual_cow_pairs >= committed_score`. How solver funds payout (flash/inventory) is irrelevant.                                        |
| 19  | Section 6.4 PTB                | `verify_and_consume_intent()` calls removed (no more `IntentRegistry`).                                              | PTB simplified: `open_settlement` → [solver fund payout] → `process_intent × N` → `close_settlement`. Intent objects consumed atomically.                                                                                       |

---

## v2.2 — Score-Commit Auction (No Reveal Phase)

Major mechanism simplification: removed reveal phase entirely. Commit now carries score (`n_cow_pairs`) instead of `hash(solution)`. Winner self-executes PTB. Bond enforces commitment faithfulness — no cryptographic reveal needed.

| #   | Section Affected              | Issue Found                                                                                          | Correction Applied                                                                                                                                                       |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 8   | Section 5.2 `settlement.move` | Reveal phase creates unnecessary complexity: `solution_to_bytes()` fragile, extra tx, extra latency. | Removed reveal phase. `commit(score=n_cow_pairs, bond)`. Winner self-executes. Bond + `finalize_and_check()` enforces commitment.                                        |
| 9   | Section 5.2 `settlement.move` | Missing: `open_batch()`, `close_commits()`, `trigger_fallback()`.                                    | Added all three. `close_commits()` selects winner on-chain (argmax score, timestamp tiebreak). `trigger_fallback()` slashes bond if winner no-execute.                   |
| 10  | Section 5.2 `settlement.move` | `check_balances()` uses `VecMap<ID,u64>` — solver can fake outputs.                                  | Replaced with `verify_and_transfer()`: accepts actual `Coin` object → `coin::value()` unforgeably. Accumulates `actual_cow_pairs` in `AuctionState`.                     |
| 11  | Section 5.2 `settlement.move` | `finalize_and_check()` missing — no enforcement of committed score.                                  | Added: asserts `actual_cow_pairs >= committed_score`. Consumes `FlashLoan` Hot Potato. Called as last cmd before `flash_repay`.                                          |
| 12  | Section 6 Solver              | `RevealManager` no longer needed.                                                                    | Removed. Solver flow: `commit` → watch `WinnerSelectedEvent` → build PTB → submit. Simpler stack.                                                                        |
| 13  | Novel Contributions           | Copy-proof claim based on keccak hash.                                                               | Revised: copy-proof now via score-only commit. Solver sees competitor score but not routing. Must have real solution to fulfill committed `n_cow_pairs` or bond slashed. |
| 14  | New: Section 6.5              | Solver economics not documented.                                                                     | Added: gas cost breakdown for winner (~0.12 SUI + flash fee) and loser (~0.02 SUI). Net profit analysis. Documented EBBO as limitation / future work.                    |

---

## v2.1 — Off-chain Intent Model (Light Registry)

One architectural change: `intent_book.move` redesigned from on-chain intent storage to nonce-only Light Registry. Motivated by: (1) contradiction between Phase 0 "On-chain? No" and actual `Table<IntentId,IntentRecord>` storage, (2) shared object bottleneck at intake, (3) unnecessary storage cost for unmatched intents.

| #   | Section Affected               | Issue Found                                                                                                                                              | Correction Applied                                                                                                                                                                                                           |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Section 5.1 `intent_book.move` | `submit_intent()` stored full `IntentRecord` on-chain — contradicts Phase 0 design, creates shared obj bottleneck, wastes storage for unmatched intents. | Replaced with Light Registry: `Table<address,u64>` nonce-only. Removed `submit_intent()`. Added `verify_and_consume_intent()` called by solver inside settlement PTB. Intent data stays off-chain in Relay until settlement. |

---

## v2.0 — Post Code Review & Literature Check

Six issues corrected after reviewing CoW Protocol source code (`GPv2Settlement.sol`, flash-loan-router, Autopilot docs) and academic papers (arxiv 2507.10149, 2510.21647).

| #   | Section Affected    | Issue Found                             | Correction Applied                                                                                                                                                            |
| --- | ------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Comparison Table    | CoW Protocol Flash funding = ✗.         | Corrected to ✓ — CIP 66 adds flash-loan-router (Aave/ERC-3156). Added dedicated Section 7 comparing both approaches.                                                          |
| 2   | Novel Contributions | "Flash funding" claimed as fully novel. | Revised: novel contribution is the specific combination: permissionless + Hot Potato guarantee + PTB atomicity + on-chain commit-reveal.                                      |
| 3   | Comparison Table    | CoW solver barrier = "small bond".      | Corrected: CoW requires DAO governance allowlist + significant bond. High barrier in practice.                                                                                |
| 4   | `settlement.move`   | No uniform clearing price.              | Added explicit design decision: uniform clearing price per token pair. Contract enforces it. Matches CoW Protocol's proven model.                                             |
| 5   | Related Work        | 3 key papers missing.                   | Added: 2507.10149 (CoW graph theory, directly formalizes Theorems 1-3), 2510.21647 (solver GA, overlaps with S2), Bachu & Wan (OFA price improvement, methodology reference). |
| 6   | Comparison Table    | CoW auction window = "2-second".        | Corrected: CoW window is 15 seconds. Our mechanism: 3s total (2s commit + 1s reveal).                                                                                         |
