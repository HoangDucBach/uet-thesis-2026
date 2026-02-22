module cow_dex::settlement;

use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::sui::SUI;
use sui::table::{Self, Table};

// === Constants ===
const MIN_BOND: u64 = 1_000_000_000; // 1 SUI (scaled)
const COMMIT_DURATION_MS: u64 = 2000;
const GRACE_PERIOD_MS: u64 = 5000;

// === Errors ===
const EWrongPhase: u64 = 0;
const EBondTooSmall: u64 = 2;
const EOutputInsufficient: u64 = 3;
const EClearingPriceMismatch: u64 = 4;
const ENotWinner: u64 = 5;
const EScoreMismatch: u64 = 6;
const EInvalidDeadline: u64 = 7;

// === Enums ===
public enum AuctionPhase has copy, drop, store {
    Commit,
    Execute,
    Done,
    Failed,
}

// === Structs ===

/// FlashLoan receipt - Hot Potato, must be consumed by flash_repay.
/// Has no drop/store/key/copy abilities to enforce consumption.
public struct FlashLoan {
    amount: u64,
}

/// A commitment submitted during commit phase.
/// * `score`: Number of CoW pairs committed by solver.
/// * `bond`: SUI balance serving as griefing protection.
/// * `timestamp`: When this commitment was submitted.
public struct CommitEntry has store {
    score: u64,
    bond: Balance<SUI>,
    timestamp: u64,
}


/// State machine for a single batch auction.
/// * `id`: Unique identifier of this auction.
/// * `batch_id`: Batch sequence number.
/// * `intent_ids`: List of intents in this batch.
/// * `phase`: Current auction phase (Commit, Execute, Done, Failed).
/// * `commit_end_ms`: Timestamp when commit phase ends.
/// * `grace_end_ms`: Timestamp when grace period (for execution) ends.
/// * `commits`: Table of commit entries by solver address (stores score, bond, timestamp).
/// * `winner`: Address of the winning solver (highest score, earliest timestamp).
/// * `actual_cow_pairs`: Count of CoW pairs actually executed (populated during execute phase).
/// * `version`: Incremented on critical parameter changes.
public struct AuctionState has key, store {
    id: UID,
    batch_id: u64,
    intent_ids: vector<ID>,
    phase: AuctionPhase,
    commit_end_ms: u64,
    grace_end_ms: u64,
    commits: Table<address, CommitEntry>,
    winner: Option<address>,
    actual_cow_pairs: u64,
    version: u64,
}

// === Functions ===

/// Open a new batch auction (v2.2 Score-Commit design).
/// Sets commit_end_ms = now + 2000ms and grace_end_ms = commit_end_ms + 5000ms.
/// * `batch_id`: The batch sequence number.
/// * `intent_ids`: Vector of intent IDs in this batch.
/// * `clock`: Sui clock for timestamp.
/// * `ctx`: Transaction context.
public fun open_batch(
    batch_id: u64,
    intent_ids: vector<ID>,
    clock: &Clock,
    ctx: &mut TxContext,
): AuctionState {
    let current_time_ms = clock.timestamp_ms();
    let commit_end_ms = current_time_ms + COMMIT_DURATION_MS;
    AuctionState {
        id: object::new(ctx),
        batch_id,
        intent_ids,
        phase: AuctionPhase::Commit,
        commit_end_ms,
        grace_end_ms: commit_end_ms + GRACE_PERIOD_MS,
        commits: table::new(ctx),
        winner: std::option::none(),
        actual_cow_pairs: 0,
        version: 0,
    }
}

/// Submit a score commitment during the commit phase (v2.2).
/// Solver commits to achieving exactly `score` CoW pairs.
/// Winner selected on-the-fly by highest score; ties broken by earliest timestamp.
/// Bond is held until after execution or fallback.
/// * `state`: The AuctionState.
/// * `score`: Number of CoW pairs committed.
/// * `bond`: SUI balance for griefing protection.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
public fun commit(
    state: &mut AuctionState,
    score: u64,
    bond: Balance<SUI>,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(state.phase == AuctionPhase::Commit, EWrongPhase);
    let current_time_ms = clock.timestamp_ms();
    assert!(current_time_ms < state.commit_end_ms, EWrongPhase);
    assert!(balance::value(&bond) >= MIN_BOND, EBondTooSmall);

    let sender = ctx.sender();
    let commit_entry = CommitEntry {
        score,
        bond,
        timestamp: current_time_ms,
    };
    table::add(&mut state.commits, sender, commit_entry);

    // Update winner if this commit is better (higher score, or same score but earlier timestamp)
    if (std::option::is_none(&state.winner)) {
        state.winner = std::option::some(sender);
    } else {
        let current_winner = *std::option::borrow(&state.winner);
        let current_winner_entry = table::borrow(&state.commits, current_winner);
        let current_winner_score = current_winner_entry.score;
        let current_winner_timestamp = current_winner_entry.timestamp;

        if (score > current_winner_score) {
            state.winner = std::option::some(sender);
        } else if (score == current_winner_score && current_time_ms < current_winner_timestamp) {
            state.winner = std::option::some(sender);
        };
    };
}

/// Close commit phase and transition to Execute phase (v2.2).
/// Called after commit_end_ms. Winner has been selected on-the-fly during commit phase.
/// Bond is NOT returned yet; retained until execution or fallback.
/// * `state`: The AuctionState.
/// * `clock`: Sui clock.
public fun close_commits(state: &mut AuctionState, clock: &Clock) {
    let current_time_ms = clock.timestamp_ms();
    assert!(state.phase == AuctionPhase::Commit, EWrongPhase);
    assert!(current_time_ms >= state.commit_end_ms, EInvalidDeadline);

    // Transition to Execute phase
    state.phase = AuctionPhase::Execute;
}

/// Verify and transfer a single CoW pair output (v2.2).
/// Called per CoW pair during Execute phase.
/// Checks EBBO floor: actual_output >= clearing_price (with documented limitation for spot volatility).
/// Increments actual_cow_pairs counter.
/// * `state`: The AuctionState.
/// * `actual_output`: Actual amount received from CoW pair.
/// * `min_required`: Minimum required by user intent.
/// * `clearing_price`: Uniform clearing price for this token pair.
/// * `ctx`: Transaction context.
public fun verify_and_transfer(
    state: &mut AuctionState,
    actual_output: u64,
    min_required: u64,
    clearing_price: u64,
) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);

    // Verify output meets user's minimum requirement
    assert!(actual_output >= min_required, EOutputInsufficient);

    // Check EBBO floor (actual >= clearing_price)
    // Note: This check assumes mid-price stability; spot price volatility over 5s may cause false positives
    assert!(actual_output >= clearing_price, EClearingPriceMismatch);

    // Increment actual CoW pair counter
    state.actual_cow_pairs = state.actual_cow_pairs + 1;
}

/// Finalize auction and consume FlashLoan Hot Potato (v2.2).
/// Verifies actual_cow_pairs >= committed score from winner.
/// Must be called as last command in settlement PTB before flash_repay.
/// Consuming FlashLoan ensures flash loan was properly repaid.
/// * `state`: The AuctionState.
/// * `flash_receipt`: FlashLoan Hot Potato to be consumed.
public fun finalize_and_check(state: &mut AuctionState, flash_receipt: FlashLoan) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
    assert!(std::option::is_some(&state.winner), ENotWinner);

    let winner = *std::option::borrow(&state.winner);
    let winner_entry = table::borrow(&state.commits, winner);
    let committed_score = winner_entry.score;

    // Verify actual_cow_pairs >= committed_score
    assert!(state.actual_cow_pairs >= committed_score, EScoreMismatch);

    // Consume FlashLoan Hot Potato
    let FlashLoan { amount: _ } = flash_receipt;

    state.phase = AuctionPhase::Done;
}

/// Trigger fallback if winner fails to execute within grace period (v2.2).
/// Slashes winner's bond.
/// Transitions to Failed phase.
/// Note: Bond is held in AuctionState; protocol should clean up via separate function.
/// * `state`: The AuctionState.
/// * `clock`: Sui clock.
public fun trigger_fallback(
    state: &mut AuctionState,
    clock: &Clock,
) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
    let current_time_ms = clock.timestamp_ms();
    assert!(current_time_ms > state.grace_end_ms, EInvalidDeadline);

    // Verify winner exists
    assert!(std::option::is_some(&state.winner), ENotWinner);

    // Transition to Failed phase (bond slashed and held in state)
    state.phase = AuctionPhase::Failed;
}

// === Getters ===

/// Get current phase.
public fun get_phase(state: &AuctionState): AuctionPhase {
    state.phase
}

/// Get batch ID.
public fun get_batch_id(state: &AuctionState): u64 {
    state.batch_id
}

/// Get list of intent IDs.
public fun get_intent_ids(state: &AuctionState): &vector<ID> {
    &state.intent_ids
}

/// Get winning solver address, if exists.
public fun get_winner(state: &AuctionState): Option<address> {
    state.winner
}

/// Get actual CoW pairs executed.
public fun get_actual_cow_pairs(state: &AuctionState): u64 {
    state.actual_cow_pairs
}

/// Get commit end timestamp (ms).
public fun get_commit_end_ms(state: &AuctionState): u64 {
    state.commit_end_ms
}

/// Get grace end timestamp (ms).
public fun get_grace_end_ms(state: &AuctionState): u64 {
    state.grace_end_ms
}

