module cow_dex::settlement;

use cow_dex::config::GlobalConfig;
use deepbook::pool::Pool as DeepbookPool;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event::emit;
use sui::sui::SUI;
use sui::table::{Self, Table};

// === Constants ===

const FLOAT_SCALING: u128 = 1_000_000_000;

// === Errors ===

const EWrongPhase: u64 = 0;
const EBondTooSmall: u64 = 1;
const EClearingPriceMismatch: u64 = 2;
const ENotWinner: u64 = 3;
const EScoreMismatch: u64 = 4;
const EInvalidDeadline: u64 = 5;
const EWrongBatch: u64 = 6;
const ENoCommits: u64 = 7;
const EDuplicateCommit: u64 = 8;

// === Enums ===

public enum AuctionPhase has copy, drop, store {
    Commit,
    Execute,
    Done,
    Failed,
}

// === Structs ===

/// Hot Potato — no abilities. Forces completion of settlement.
/// Must be consumed by close_settlement() or PTB validation fails.
/// Tracks actual CoW pairs delivered.
///
/// * `batch_id`: Batch this ticket is for.
/// * `committed_score`: Winner's committed n_cow_pairs count.
/// * `actual_cow_pairs`: Incremented per process_intent() call.
public struct SettlementTicket {
    batch_id: u64,
    committed_score: u64,
    actual_cow_pairs: u64,
}

/// Commitment entry for a solver in commit phase.
/// * `score`: Number of CoW pairs committed.
/// * `bond`: SUI balance for griefing protection.
/// * `timestamp`: When committed (for tiebreaker).
public struct CommitEntry has store {
    score: u64,
    bond: Balance<SUI>,
    timestamp: u64,
}

/// Batch auction state machine.
/// * `id`: Unique object ID.
/// * `batch_id`: Batch sequence number.
/// * `intent_ids`: Vector of Intent IDs in this batch.
/// * `phase`: Current phase.
/// * `commit_end_ms`: Deadline for commit phase.
/// * `execute_deadline_ms`: Deadline for execution (commit_end + grace).
/// * `commits`: Table of solver commitments.
/// * `winner`: Winning solver address.
/// * `winner_score`: Winning score.
public struct AuctionState has key {
    id: UID,
    batch_id: u64,
    intent_ids: vector<ID>,
    phase: AuctionPhase,
    commit_end_ms: u64,
    execute_deadline_ms: u64,
    commits: Table<address, CommitEntry>,
    winner: Option<address>,
    winner_score: u64,
    runner_up: Option<address>,
    runner_up_score: u64,
}

// === Events ===

/// Emitted when a new batch is opened.
public struct BatchOpenedEvent has copy, drop {
    batch_id: u64,
    auction_state_id: ID,
    intent_ids: vector<ID>,
    commit_end_ms: u64,
    execute_deadline_ms: u64,
}

/// Emitted when winner is selected after commit phase closes.
public struct WinnerSelectedEvent has copy, drop {
    batch_id: u64,
    winner: address,
    winner_score: u64,
    runner_up: Option<address>,
    runner_up_score: u64,
}

/// Emitted when settlement completes successfully.
public struct SettlementCompleteEvent has copy, drop {
    batch_id: u64,
    winner: address,
    actual_cow_pairs: u64,
    committed_score: u64,
}

/// Emitted when fallback is triggered (winner failed to execute).
public struct FallbackTriggeredEvent has copy, drop {
    batch_id: u64,
    winner: address,
    bond_slashed: u64,
}

// === Functions ===

/// Open a new batch auction and share immediately.
/// Entry function for PTB/off-chain relay — shares object in one transaction.
/// Permissionless — relay or anyone can call.
///
/// * `config`: GlobalConfig for protocol parameters.
/// * `batch_id`: Batch sequence number.
/// * `intent_ids`: Vector of Intent IDs in this batch.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
entry fun open_batch_and_share(
    config: &GlobalConfig,
    batch_id: u64,
    intent_ids: vector<ID>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let state = open_batch(config, batch_id, intent_ids, clock, ctx);
    transfer::share_object(state);
}

/// Open a new batch auction.
/// Permissionless — relay or anyone can call.
///
/// * `config`: GlobalConfig for protocol parameters.
/// * `batch_id`: Batch sequence number.
/// * `intent_ids`: Vector of Intent IDs in this batch.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
public fun open_batch(
    config: &GlobalConfig,
    batch_id: u64,
    intent_ids: vector<ID>,
    clock: &Clock,
    ctx: &mut TxContext,
): AuctionState {
    let current_time_ms = clock.timestamp_ms();
    let commit_end_ms = current_time_ms + config.commit_duration_ms();
    let execute_deadline_ms = commit_end_ms + config.grace_period_ms();

    let state = AuctionState {
        id: object::new(ctx),
        batch_id,
        intent_ids,
        phase: AuctionPhase::Commit,
        commit_end_ms,
        execute_deadline_ms,
        commits: table::new(ctx),
        winner: option::none(),
        winner_score: 0,
        runner_up: option::none(),
        runner_up_score: 0,
    };

    emit(BatchOpenedEvent {
        batch_id,
        auction_state_id: object::id(&state),
        intent_ids,
        commit_end_ms,
        execute_deadline_ms,
    });

    state
}

/// Submit a score commitment during commit phase.
/// Winner selected on-the-fly: highest score, earliest timestamp wins.
/// No duplicate commits allowed.
///
/// * `config`: GlobalConfig for protocol parameters.
/// * `state`: AuctionState.
/// * `score`: n_cow_pairs committed by solver.
/// * `bond`: SUI bond for griefing protection.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
public fun commit(
    config: &GlobalConfig,
    state: &mut AuctionState,
    score: u64,
    bond: Coin<SUI>,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(state.phase == AuctionPhase::Commit, EWrongPhase);
    let current_time_ms = clock.timestamp_ms();
    assert!(current_time_ms < state.commit_end_ms, EInvalidDeadline);
    assert!(coin::value(&bond) >= config.min_bond(), EBondTooSmall);

    let sender = ctx.sender();
    assert!(!table::contains(&state.commits, sender), EDuplicateCommit);

    let entry = CommitEntry {
        score,
        bond: coin::into_balance(bond),
        timestamp: current_time_ms,
    };
    table::add(&mut state.commits, sender, entry);

    // Update winner on-the-fly (highest score, earliest timestamp for ties)
    if (option::is_none(&state.winner)) {
        state.winner = option::some(sender);
        state.winner_score = score;
    } else {
        let current_winner = *option::borrow(&state.winner);
        let entry_ref = table::borrow(&state.commits, current_winner);
        let current_winner_timestamp = entry_ref.timestamp;

        if (score > state.winner_score) {
            // New winner is better
            state.runner_up = option::some(current_winner);
            state.runner_up_score = state.winner_score;
            state.winner = option::some(sender);
            state.winner_score = score;
        } else if (score > state.runner_up_score) {
            // Not better than winner, but better than runner-up
            state.runner_up = option::some(sender);
            state.runner_up_score = score;
        } else if (score == state.winner_score && current_time_ms < current_winner_timestamp) {
            // Tie with winner, but earlier timestamp
            state.runner_up = option::some(current_winner);
            state.runner_up_score = state.winner_score;
            state.winner = option::some(sender);
        };
    };
}

/// Close commit phase and transition to Execute phase.
///
/// * `state`: AuctionState.
/// * `clock`: Sui clock.
public fun close_commits(state: &mut AuctionState, clock: &Clock) {
    let current_time_ms = clock.timestamp_ms();
    assert!(state.phase == AuctionPhase::Commit, EWrongPhase);
    assert!(current_time_ms >= state.commit_end_ms, EInvalidDeadline);
    assert!(option::is_some(&state.winner), ENoCommits);

    state.phase = AuctionPhase::Execute;

    emit(WinnerSelectedEvent {
        batch_id: state.batch_id,
        winner: *option::borrow(&state.winner),
        winner_score: state.winner_score,
        runner_up: state.runner_up,
        runner_up_score: state.runner_up_score,
    });
}

/// Winner calls to open settlement and receive Hot Potato ticket.
/// Only winner can call (capability check).
///
/// * `state`: AuctionState.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
public fun open_settlement(
    state: &mut AuctionState,
    clock: &Clock,
    ctx: &TxContext,
): SettlementTicket {
    let current_time_ms = clock.timestamp_ms();
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
    assert!(current_time_ms <= state.execute_deadline_ms, EInvalidDeadline);
    assert!(option::is_some(&state.winner), ENotWinner);

    let winner = *option::borrow(&state.winner);
    assert!(winner == ctx.sender(), ENotWinner);

    SettlementTicket {
        batch_id: state.batch_id,
        committed_score: state.winner_score,
        actual_cow_pairs: 0,
    }
}

/// Process a single CoW pair intent.
/// [v2.3 Optimized] Uses 2 phantom types for type-safe SellCoin ↔ BuyCoin matching.
/// Takes Intent by value (deletes it — replay protection).
/// Calculates EBBO floor on-chain using DeepBook pool (solver cannot fake prices).
/// Increments actual_cow_pairs counter in ticket.
/// Only holder of SettlementTicket can call (only winner has it).
///
/// * `ticket`: SettlementTicket (must be mutable to increment counter).
/// * `intent`: Intent<SellCoin, BuyCoin> (taken by value, deleted atomically).
/// * `payout`: Solver's payout coin of type BuyCoin (from any source: flash, inventory).
/// * `pool`: DeepBook pool for on-chain price verification (immutable).
/// * `clock`: Sui clock for DeepBook mid_price calculation.
/// * `ctx`: Transaction context.
///
/// Type Parameters:
/// * `SellCoin`: Coin type user was selling (user input locked in Intent).
/// * `BuyCoin`: Coin type user is receiving (payout coin provided by solver).
#[allow(lint(self_transfer))]
public fun process_intent<SellCoin, BuyCoin>(
    ticket: &mut SettlementTicket,
    intent: cow_dex::intent_book::Intent<SellCoin, BuyCoin>,
    payout: Coin<BuyCoin>,
    pool: &DeepbookPool<SellCoin, BuyCoin>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // 1. Verify intent belongs to this batch
    let intent_batch_id = cow_dex::intent_book::batch_id(&intent);
    assert!(option::is_some(&intent_batch_id), EWrongBatch);
    assert!(*option::borrow(&intent_batch_id) == ticket.batch_id, EWrongBatch);

    // 2. Consume intent on-chain (deleted — replay impossible by Sui linear types)
    let (owner, sell_balance, min_amount_out, sell_amount) = cow_dex::intent_book::consume_intent(
        intent,
    );

    // 3. Calculate EBBO floor on-chain using DeepBook mid_price
    let mid_price = deepbook::pool::mid_price(pool, clock);

    // fair_out = sell_amount * mid_price / FLOAT_SCALING (raw math, no decimals needed)
    let fair_out_u128 = (sell_amount as u128) * (mid_price as u128) / FLOAT_SCALING;

    // Safety check: prevent overflow when casting back to u64
    assert!(fair_out_u128 <= (9_223_372_036_854_775_807u128), EClearingPriceMismatch); // i64::MAX
    let fair_out = (fair_out_u128 as u64);

    // ebbo_floor = max(min_amount_out, fair_out * 99%)
    // Do slippage calculation in u128 to prevent overflow
    let slippage_u128 = (fair_out as u128) * 99u128 / 100u128;
    assert!(slippage_u128 <= (9_223_372_036_854_775_807u128), EClearingPriceMismatch);
    let slippage_protection = (slippage_u128 as u64);
    let ebbo_floor = max_u64(min_amount_out, slippage_protection);

    // 4. Verify payout meets floor (solver cannot fake prices)
    let actual = coin::value(&payout);
    assert!(actual >= ebbo_floor, EClearingPriceMismatch);

    // 5. Transfer payout to user (owned object, fast path)
    transfer::public_transfer(payout, owner);

    // 6. Return sell coins to solver
    let sell_coin = coin::from_balance(sell_balance, ctx);
    transfer::public_transfer(sell_coin, ctx.sender());

    // 7. Increment actual CoW pair counter
    ticket.actual_cow_pairs = ticket.actual_cow_pairs + 1;
}

/// Close settlement — consume Hot Potato, verify score, return winner bond.
/// Last command in PTB before flash_repay().
///
/// * `state`: AuctionState.
/// * `ticket`: SettlementTicket (consumed — satisfaction check).
/// * `ctx`: Transaction context.
public fun close_settlement(
    state: &mut AuctionState,
    ticket: SettlementTicket,
    ctx: &mut TxContext,
) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);

    let SettlementTicket {
        batch_id,
        committed_score,
        actual_cow_pairs,
    } = ticket;

    assert!(batch_id == state.batch_id, EWrongBatch);

    // Verify actual delivery >= committed score
    assert!(actual_cow_pairs >= committed_score, EScoreMismatch);

    let winner = *option::borrow(&state.winner);

    // Return winner's bond
    let entry = table::remove(&mut state.commits, winner);
    let CommitEntry { bond, score: _, timestamp: _ } = entry;
    transfer::public_transfer(
        coin::from_balance(bond, ctx),
        winner,
    );

    state.phase = AuctionPhase::Done;

    emit(SettlementCompleteEvent {
        batch_id: state.batch_id,
        winner,
        actual_cow_pairs,
        committed_score,
    });
}

/// Trigger fallback if winner fails to execute within grace period.
/// Slashes winner bond (transferred to caller as reward for triggering fallback).
///
/// * `state`: AuctionState.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
#[allow(lint(self_transfer))]
public fun trigger_fallback(state: &mut AuctionState, clock: &Clock, ctx: &mut TxContext) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
    let current_time_ms = clock.timestamp_ms();
    assert!(current_time_ms > state.execute_deadline_ms, EInvalidDeadline);

    let winner = *option::borrow(&state.winner);
    let entry = table::remove(&mut state.commits, winner);
    let CommitEntry { bond, score: _, timestamp: _ } = entry;
    let slashed_amount = balance::value(&bond);

    // Transfer slashed bond to caller (reward for maintaining protocol)
    // In production, this should go to a treasury address
    transfer::public_transfer(
        coin::from_balance(bond, ctx),
        ctx.sender(),
    );

    state.phase = AuctionPhase::Failed;

    emit(FallbackTriggeredEvent {
        batch_id: state.batch_id,
        winner,
        bond_slashed: slashed_amount,
    });
}

/// Losing solvers withdraw their bonds after batch is Done or Failed.
///
/// * `state`: AuctionState.
/// * `ctx`: Transaction context.
#[allow(lint(self_transfer))]
public fun claim_refund(state: &mut AuctionState, ctx: &mut TxContext) {
    assert!(state.phase == AuctionPhase::Done || state.phase == AuctionPhase::Failed, EWrongPhase);

    let sender = ctx.sender();
    assert!(table::contains(&state.commits, sender), ENotWinner);

    let entry = table::remove(&mut state.commits, sender);
    let CommitEntry { bond, score: _, timestamp: _ } = entry;

    transfer::public_transfer(
        coin::from_balance(bond, ctx),
        sender,
    );
}

// === Getters ===

/// Get current phase.
public fun phase(state: &AuctionState): AuctionPhase {
    state.phase
}

/// Get batch ID.
public fun batch_id(state: &AuctionState): u64 {
    state.batch_id
}

/// Get winning solver address.
public fun winner(state: &AuctionState): Option<address> {
    state.winner
}

/// Get winner's committed score.
public fun winner_score(state: &AuctionState): u64 {
    state.winner_score
}

/// Get commit phase deadline.
public fun commit_end_ms(state: &AuctionState): u64 {
    state.commit_end_ms
}

/// Get execution deadline (commit_end + grace).
public fun execute_deadline_ms(state: &AuctionState): u64 {
    state.execute_deadline_ms
}

/// Get ticket's batch ID.
public fun ticket_batch_id(ticket: &SettlementTicket): u64 {
    ticket.batch_id
}

/// Get ticket's committed score.
public fun ticket_committed_score(ticket: &SettlementTicket): u64 {
    ticket.committed_score
}

/// Get ticket's actual CoW pairs count.
public fun ticket_actual_cow_pairs(ticket: &SettlementTicket): u64 {
    ticket.actual_cow_pairs
}

public fun is_commit_phase(state: &AuctionState): bool {
    state.phase == AuctionPhase::Commit
}

public fun is_execute_phase(state: &AuctionState): bool {
    state.phase == AuctionPhase::Execute
}

public fun is_done_phase(state: &AuctionState): bool {
    state.phase == AuctionPhase::Done
}

public fun is_failed_phase(state: &AuctionState): bool {
    state.phase == AuctionPhase::Failed
}

// === Helper Functions ===

/// Return maximum of two u64 values.
fun max_u64(a: u64, b: u64): u64 {
    if (a > b) a else b
}

// === Test Helpers ===

#[test_only]
public fun create_ticket_for_testing(batch_id: u64, committed_score: u64): SettlementTicket {
    SettlementTicket { batch_id, committed_score, actual_cow_pairs: 0 }
}

#[test_only]
public fun destroy_ticket_for_testing(ticket: SettlementTicket) {
    let SettlementTicket { .. } = ticket;
}

#[test_only]
public fun share_state_for_testing(state: AuctionState) {
    transfer::share_object(state);
}

#[test_only]
public fun set_phase_execute_for_testing(state: &mut AuctionState, execute_deadline_ms: u64) {
    state.phase = AuctionPhase::Execute;
    state.execute_deadline_ms = execute_deadline_ms;
}

#[test_only]
public fun force_winner_for_testing(state: &mut AuctionState, winner: address, score: u64) {
    state.winner = option::some(winner);
    state.winner_score = score;
}
