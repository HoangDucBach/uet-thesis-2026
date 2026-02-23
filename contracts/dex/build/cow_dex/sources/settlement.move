module cow_dex::settlement;

use cow_dex::config::GlobalConfig;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event::emit;
use sui::sui::SUI;
use sui::table::{Self, Table};

// === Errors ===

const EWrongPhase: u64 = 0;
const EBondTooSmall: u64 = 1;
const EOutputInsufficient: u64 = 2;
const EClearingPriceMismatch: u64 = 3;
const ENotWinner: u64 = 4;
const EScoreMismatch: u64 = 5;
const EInvalidDeadline: u64 = 6;
const EWrongBatch: u64 = 7;

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

    AuctionState {
        id: object::new(ctx),
        batch_id,
        intent_ids,
        phase: AuctionPhase::Commit,
        commit_end_ms,
        execute_deadline_ms: commit_end_ms + config.grace_period_ms(),
        commits: table::new(ctx),
        winner: std::option::none(),
        winner_score: 0,
        runner_up: std::option::none(),
        runner_up_score: 0,
    }
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
    assert!(!table::contains(&state.commits, sender), EWrongPhase);

    let entry = CommitEntry {
        score,
        bond: coin::into_balance(bond),
        timestamp: current_time_ms,
    };
    table::add(&mut state.commits, sender, entry);

    // Update winner on-the-fly (highest score, earliest timestamp for ties)
    if (std::option::is_none(&state.winner)) {
        state.winner = std::option::some(sender);
        state.winner_score = score;
    } else {
        let current_winner = *std::option::borrow(&state.winner);
        let entry_ref = table::borrow(&state.commits, current_winner);
        let current_winner_timestamp = entry_ref.timestamp;

        if (score > state.winner_score) {
            // New winner is better
            state.runner_up = std::option::some(current_winner);
            state.runner_up_score = state.winner_score;
            state.winner = std::option::some(sender);
            state.winner_score = score;
        } else if (score > state.runner_up_score) {
            // Not better than winner, but better than runner-up
            state.runner_up = std::option::some(sender);
            state.runner_up_score = score;
        } else if (score == state.winner_score && current_time_ms < current_winner_timestamp) {
            // Tie with winner, but earlier timestamp
            state.runner_up = std::option::some(current_winner);
            state.runner_up_score = state.winner_score;
            state.winner = std::option::some(sender);
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

    state.phase = AuctionPhase::Execute;

    emit(WinnerSelectedEvent {
        batch_id: state.batch_id,
        winner: *std::option::borrow(&state.winner),
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
    assert!(std::option::is_some(&state.winner), ENotWinner);

    let winner = *std::option::borrow(&state.winner);
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
/// Verifies EBBO floor check.
/// Increments actual_cow_pairs counter in ticket.
/// Only holder of SettlementTicket can call (only winner has it).
///
/// * `ticket`: SettlementTicket (must be mutable to increment counter).
/// * `intent`: Intent<SellCoin, BuyCoin> (taken by value, deleted atomically).
/// * `payout`: Solver's payout coin of type BuyCoin (from any source: flash, inventory).
/// * `min_required`: Minimum output required by user (intent.min_amount_out).
/// * `ebbo_floor`: EBBO floor price (max(min_required, mid_price × sell × 99/100)).
/// * `ctx`: Transaction context.
///
/// Type Parameters:
/// * `SellCoin`: Coin type user was selling.
/// * `BuyCoin`: Coin type user is receiving.
public fun process_intent<SellCoin, BuyCoin>(
    ticket: &mut SettlementTicket,
    intent: cow_dex::intent_book::Intent<SellCoin, BuyCoin>,
    payout: Coin<BuyCoin>,
    min_required: u64,
    ebbo_floor: u64,
    ctx: &mut TxContext,
) {
    // Verify intent belongs to this batch
    let intent_batch_id = cow_dex::intent_book::batch_id(&intent);
    assert!(std::option::is_some(&intent_batch_id), EWrongBatch);
    assert!(*std::option::borrow(&intent_batch_id) == ticket.batch_id, EWrongBatch);

    // Check EBBO: actual payout >= max(min_required, ebbo_floor)
    let actual = coin::value(&payout);
    assert!(actual >= min_required, EOutputInsufficient);
    assert!(actual >= ebbo_floor, EClearingPriceMismatch);

    // Consume intent (deletes it — Sui linear type system prevents replay)
    let (owner, sell_balance, _) = cow_dex::intent_book::consume_intent(intent);

    // Transfer payout to user
    transfer::public_transfer(payout, owner);

    // Return sell coins to caller (winner solver)
    let sell_coin = coin::from_balance(sell_balance, ctx);
    transfer::public_transfer(sell_coin, ctx.sender());

    // Increment actual CoW pair counter
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

    let winner = *std::option::borrow(&state.winner);

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

    let winner = *std::option::borrow(&state.winner);
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
public fun withdraw_losing_bond(state: &mut AuctionState, ctx: &mut TxContext) {
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
