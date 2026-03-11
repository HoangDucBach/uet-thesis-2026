module cow_dex::settlement;

use cow_dex::config::GlobalConfig;
use cow_dex::intent_book::{Self, Intent};
use cow_dex::math;
use deepbook::pool::Pool as DeepbookPool;
use std::u64;
use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::Coin;
use sui::event::emit;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::vec_set::{Self, VecSet};

// === Errors ===

const EWrongPhase: u64 = 0;
const EBondTooSmall: u64 = 1;
const EClearingPriceMismatch: u64 = 2;
const ENotWinner: u64 = 3;
const EScoreMismatch: u64 = 4;
const EInvalidDeadline: u64 = 5;
const EWrongBatch: u64 = 6;
const EDuplicateCommit: u64 = 7;
const EIncompleteBatch: u64 = 8;

// === Constants ===

const SLIPPAGE_TOLERANCE_NUM: u128 = 99;
const SLIPPAGE_TOLERANCE_DENOM: u128 = 100;

// === Enums ===

public enum AuctionPhase has copy, drop, store {
    Commit,
    Execute,
    Done,
    Failed,
    Aborted,
}

// === Structs ===

/// Global batch counter state.
/// * `id`: Unique object ID.
/// * `next_batch_id`: Counter for next batch (starts at 0).
public struct BatchRegistry has key {
    id: UID,
    next_batch_id: u64,
}

/// Hot Potato — no abilities. Forces completion of settlement.
/// Must be consumed by close_settlement() or PTB validation fails.
///
/// * `batch_id`: Batch this ticket is for.
/// * `committed_score`: Winner's committed surplus estimate (in USDC-scaled units).
/// * `actual_surplus`: Accumulated surplus per process_intent() call.
/// * `processed_count`: Number of intents processed so far.
public struct SettlementTicket {
    batch_id: u64,
    intent_ids: VecSet<ID>,
    committed_score: u64,
    actual_surplus: u64,
}

/// Commitment entry for a solver in commit phase.
/// * `score`: Estimated surplus committed by solver (in USDC-scaled units).
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
    intent_ids: VecSet<ID>,
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

/// Emmited when batch aborted due to no commits.
public struct BatchAbortedEvent has copy, drop {
    batch_id: u64,
}

/// Emitted when settlement completes successfully.
public struct SettlementCompleteEvent has copy, drop {
    batch_id: u64,
    winner: address,
    actual_surplus: u64,
    committed_score: u64,
}

/// Emitted when fallback is triggered (winner failed to execute).
public struct FallbackTriggeredEvent has copy, drop {
    batch_id: u64,
    winner: address,
    bond_slashed: u64,
}

// === Functions ===

fun calculate_price_floor<Base, Quote>(
    pool: &DeepbookPool<Base, Quote>,
    is_base_to_quote: bool,
    amount: u64,
    user_min_out: u64,
    clock: &Clock,
): u64 {
    let pool_mid_price = pool.mid_price(clock);
    let scaling = math::float_scaling();
    let mid_price = if (is_base_to_quote) {
        pool_mid_price
    } else {
        let flipped_u128 = (scaling  * scaling) / (pool_mid_price as u128);
        assert!(flipped_u128 <= math::max_u64(), EClearingPriceMismatch);
        (flipped_u128 as u64)
    };
    let fair_out_u128 = (amount as u128) * (mid_price as u128) / scaling;
    assert!(fair_out_u128 <= math::max_u64(), EClearingPriceMismatch);
    let fair_out = (fair_out_u128 as u64);

    let slippage_u128 = (fair_out as u128) * SLIPPAGE_TOLERANCE_NUM / SLIPPAGE_TOLERANCE_DENOM;
    assert!(slippage_u128 <= math::max_u64(), EClearingPriceMismatch);
    let slippage_protection = (slippage_u128 as u64);
    u64::max(user_min_out, slippage_protection)
}

/// Initialize global batch counter.
fun init(ctx: &mut TxContext) {
    transfer::share_object(BatchRegistry {
        id: object::new(ctx),
        next_batch_id: 0,
    });
}

/// Entry func to open a new batch auction and share.
///
/// * `batch_state`: Global batch counter state.
/// * `config`: GlobalConfig for protocol parameters.
/// * `intent_ids`: Vector of Intent IDs in this batch.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
entry fun open_batch_and_share(
    batch_state: &mut BatchRegistry,
    config: &GlobalConfig,
    intent_ids: vector<ID>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let state = open_batch(batch_state, config, intent_ids, clock, ctx);
    transfer::share_object(state);
}

/// Open a new batch auction.
///
/// * `batch_state`: Global batch counter state.
/// * `config`: GlobalConfig for protocol parameters.
/// * `intent_ids`: Vector of Intent IDs in this batch.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
public fun open_batch(
    batch_state: &mut BatchRegistry,
    config: &GlobalConfig,
    intent_ids: vector<ID>,
    clock: &Clock,
    ctx: &mut TxContext,
): AuctionState {
    let batch_id = batch_state.next_batch_id;
    batch_state.next_batch_id = batch_id + 1;

    let current_time_ms = clock.timestamp_ms();
    let commit_end_ms = current_time_ms + config.commit_duration_ms();
    let execute_deadline_ms = commit_end_ms + config.grace_period_ms();

    let intent_ids_vecset = vec_set::from_keys(intent_ids);

    let state = AuctionState {
        id: object::new(ctx),
        batch_id,
        intent_ids: intent_ids_vecset,
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
        auction_state_id: state.id.to_inner(),
        intent_ids,
        commit_end_ms,
        execute_deadline_ms,
    });

    state
}

/// Submit a score commitment during commit phase.
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
    assert!(bond.value() >= config.min_bond(), EBondTooSmall);

    let sender = ctx.sender();
    assert!(!state.commits.contains(sender), EDuplicateCommit);

    let entry = CommitEntry {
        score,
        bond: bond.into_balance(),
        timestamp: current_time_ms,
    };
    state.commits.add(sender, entry);

    if (state.winner.is_none()) {
        state.winner = option::some(sender);
        state.winner_score = score;
    } else {
        let current_winner = *state.winner.borrow();

        if (score > state.winner_score) {
            state.runner_up = option::some(current_winner);
            state.runner_up_score = state.winner_score;
            state.winner = option::some(sender);
            state.winner_score = score;
        } else if (score > state.runner_up_score) {
            state.runner_up = option::some(sender);
            state.runner_up_score = score;
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

    if (state.winner.is_none()) {
        state.phase = AuctionPhase::Aborted;
        emit(BatchAbortedEvent { batch_id: state.batch_id });
    } else {
        state.phase = AuctionPhase::Execute;

        emit(WinnerSelectedEvent {
            batch_id: state.batch_id,
            winner: *state.winner.borrow(),
            winner_score: state.winner_score,
            runner_up: state.runner_up,
            runner_up_score: state.runner_up_score,
        });
    }
}

/// Winner calls to open settlement and receive Hot Potato ticket.
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
    assert!(state.winner.is_some(), ENotWinner);

    let winner = *state.winner.borrow();
    assert!(winner == ctx.sender(), ENotWinner);

    SettlementTicket {
        batch_id: state.batch_id,
        intent_ids: state.intent_ids,
        committed_score: state.winner_score,
        actual_surplus: 0,
    }
}

/// Process intent selling Base and buying Quote.
///
/// * `ticket`: SettlementTicket.
/// * `intent`: Intent<Base, Quote> — selling Base, buying Quote.
/// * `payout`: Coin<Quote> — payout for intent owner.
/// * `pool`: DeepbookPool<Base, Quote>.
/// * `clock`: Sui clock for DeepBook mid_price calculation.
/// * `ctx`: Transaction context.
///
/// Returns: `Coin<Base>` — base coin released from the intent for solver.
public fun process_intent_base_to_quote<Base, Quote>(
    ticket: &mut SettlementTicket,
    intent: Intent<Base, Quote>,
    payout: Coin<Quote>,
    pool: &DeepbookPool<Base, Quote>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<Base> {
    let intent_id_val = intent_book::intent_id(&intent);
    vec_set::remove(&mut ticket.intent_ids, &intent_id_val);

    let (owner, sell_balance, min_amount_out) = intent_book::consume_intent(intent);
    let sell_amount = sell_balance.value();

    let price_floor = calculate_price_floor(
        pool,
        true,
        sell_amount,
        min_amount_out,
        clock,
    );

    assert!(payout.value() >= price_floor, EClearingPriceMismatch);
    ticket.actual_surplus = ticket.actual_surplus + (payout.value() - price_floor);

    transfer::public_transfer(payout, owner);

    sell_balance.into_coin(ctx)
}

/// Process intent selling Quote and buying Base.
///
/// * `ticket`: SettlementTicket.
/// * `intent`: Intent<Quote, Base> — selling Quote, buying Base.
/// * `payout`: Coin<Base> — payout for intent owner.
/// * `pool`: DeepbookPool<Base, Quote>.
/// * `clock`: Sui clock for DeepBook mid_price calculation.
/// * `ctx`: Transaction context.
///
/// Returns: `Coin<Quote>` — quote coin released from the intent for solver.
public fun process_intent_quote_to_base<Base, Quote>(
    ticket: &mut SettlementTicket,
    intent: Intent<Quote, Base>,
    payout: Coin<Base>,
    pool: &DeepbookPool<Base, Quote>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<Quote> {
    let intent_id_val = intent_book::intent_id(&intent);
    vec_set::remove(&mut ticket.intent_ids, &intent_id_val);

    let (owner, sell_balance, min_amount_out) = intent_book::consume_intent(intent);
    let sell_amount = sell_balance.value();

    let price_floor = calculate_price_floor(
        pool,
        false,
        sell_amount,
        min_amount_out,
        clock,
    );

    assert!(payout.value() >= price_floor, EClearingPriceMismatch);
    ticket.actual_surplus = ticket.actual_surplus + (payout.value() - price_floor);

    transfer::public_transfer(payout, owner);

    sell_balance.into_coin(ctx)
}

/// Process partial fill for intent selling Base and buying Quote.
/// Intent is mutated but NOT deleted — stay on-chain.
///
/// * `ticket`: SettlementTicket.
/// * `intent`: &mut Intent<Base, Quote> — selling Base, buying Quote.
/// * `fill_amount`: Base units to fill this round.
/// * `payout`: Coin<Quote> — payout for intent owner.
/// * `pool`: DeepbookPool<Base, Quote>.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
///
/// Returns: `Coin<Base>` — partial base coin released from the intent for solver.
public fun process_intent_partial_base_to_quote<Base, Quote>(
    ticket: &mut SettlementTicket,
    intent: &mut Intent<Base, Quote>,
    fill_amount: u64,
    payout: Coin<Quote>,
    pool: &DeepbookPool<Base, Quote>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<Base> {
    let intent_id_val = intent_book::intent_id(intent);
    assert!(vec_set::contains(&ticket.intent_ids, &intent_id_val), EWrongBatch);
    vec_set::remove(&mut ticket.intent_ids, &intent_id_val);

    let (owner, partial_sell_balance, proportional_min_out) = intent_book::consume_intent_partial(
        intent,
        fill_amount,
    );

    let price_floor = calculate_price_floor(
        pool,
        true,
        fill_amount,
        proportional_min_out,
        clock,
    );

    assert!(payout.value() >= price_floor, EClearingPriceMismatch);
    ticket.actual_surplus = ticket.actual_surplus + (payout.value() - price_floor);

    transfer::public_transfer(payout, owner);

    partial_sell_balance.into_coin(ctx)
}

/// Process partial fill for intent selling Quote and buying Base.
/// Intent is mutated but NOT deleted — stay on-chain.
///
/// * `ticket`: SettlementTicket.
/// * `intent`: &mut Intent<Quote, Base> — selling Quote, buying Base.
/// * `fill_amount`: Quote units to fill this round.
/// * `payout`: Coin<Base> — payout for intent owner.
/// * `pool`: DeepbookPool<Base, Quote>.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
///
/// Returns: `Coin<Quote>` — partial quote coin released from the intent for solver.
public fun process_intent_partial_quote_to_base<Base, Quote>(
    ticket: &mut SettlementTicket,
    intent: &mut Intent<Quote, Base>,
    fill_amount: u64,
    payout: Coin<Base>,
    pool: &DeepbookPool<Base, Quote>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<Quote> {
    let intent_id_val = intent_book::intent_id(intent);
    assert!(vec_set::contains(&ticket.intent_ids, &intent_id_val), EWrongBatch);
    vec_set::remove(&mut ticket.intent_ids, &intent_id_val);

    let (owner, partial_sell_balance, proportional_min_out) = intent_book::consume_intent_partial(
        intent,
        fill_amount,
    );

    let price_floor = calculate_price_floor(
        pool,
        false,
        fill_amount,
        proportional_min_out,
        clock,
    );

    assert!(payout.value() >= price_floor, EClearingPriceMismatch);
    ticket.actual_surplus = ticket.actual_surplus + (payout.value() - price_floor);

    transfer::public_transfer(payout, owner);

    partial_sell_balance.into_coin(ctx)
}

/// Close settlement — consume Hot Potato, verify score, return winner bond.
///
/// * `state`: AuctionState.
/// * `ticket`: SettlementTicket (consumed — satisfaction check).
/// * `config`: GlobalConfig for score_tolerance_bps.
/// * `ctx`: Transaction context.
public fun close_settlement(
    state: &mut AuctionState,
    ticket: SettlementTicket,
    config: &GlobalConfig,
    ctx: &mut TxContext,
) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);

    let SettlementTicket {
        batch_id,
        intent_ids,
        committed_score,
        actual_surplus,
    } = ticket;

    assert!(batch_id == state.batch_id, EWrongBatch);

    // Enforce that every intent in the batch was processed
    assert!(vec_set::is_empty(&intent_ids), EIncompleteBatch);

    // Verify actual surplus >= score_tolerance_bps% of committed score.
    let threshold =
        (
            (committed_score as u128) * (config.score_tolerance_bps() as u128) / 10_000u128 as u128,
        ) as u64;
    assert!(actual_surplus >= threshold, EScoreMismatch);

    let winner = *state.winner.borrow();

    // Return winner's bond
    let CommitEntry { bond, score: _, timestamp: _ } = state.commits.remove(winner);
    transfer::public_transfer(bond.into_coin(ctx), winner);

    state.phase = AuctionPhase::Done;

    emit(SettlementCompleteEvent {
        batch_id: state.batch_id,
        winner,
        actual_surplus,
        committed_score,
    });
}

/// Trigger fallback if winner fails to execute within grace period.
///
/// * `state`: AuctionState.
/// * `clock`: Sui clock.
/// * `ctx`: Transaction context.
#[allow(lint(self_transfer))]
public fun trigger_fallback(state: &mut AuctionState, clock: &Clock, ctx: &mut TxContext) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
    let current_time_ms = clock.timestamp_ms();
    assert!(current_time_ms > state.execute_deadline_ms, EInvalidDeadline);

    let winner = *state.winner.borrow();
    let CommitEntry { bond, score: _, timestamp: _ } = state.commits.remove(winner);
    let slashed_amount = bond.value();

    transfer::public_transfer(bond.into_coin(ctx), ctx.sender());

    state.phase = AuctionPhase::Failed;

    emit(FallbackTriggeredEvent {
        batch_id: state.batch_id,
        winner,
        bond_slashed: slashed_amount,
    });
}

/// Unlock an intent after its batch reaches a terminal phase (Done, Failed, Aborted).
/// Allows the intent to be cancelled or added to a new batch.
///
/// * `state`: AuctionState whose phase must be Done, Failed, or Aborted.
/// * `intent`: Intent to unlock.
public fun unlock_batch_intent<SellCoin, BuyCoin>(
    state: &AuctionState,
    intent: &mut Intent<SellCoin, BuyCoin>,
) {
    assert!(
        state.phase == AuctionPhase::Done ||
        state.phase == AuctionPhase::Failed ||
        state.phase == AuctionPhase::Aborted,
        EWrongPhase,
    );
    let intent_id_val = intent_book::intent_id(intent);
    assert!(vec_set::contains(&state.intent_ids, &intent_id_val), EWrongBatch);
    intent_book::unlock_intent(intent);
}

/// Losing solvers withdraw their bonds after batch is Done or Failed.
///
/// * `state`: AuctionState.
/// * `ctx`: Transaction context.
#[allow(lint(self_transfer))]
public fun claim_refund(state: &mut AuctionState, ctx: &mut TxContext) {
    assert!(state.phase == AuctionPhase::Done || state.phase == AuctionPhase::Failed, EWrongPhase);

    let sender = ctx.sender();
    assert!(state.commits.contains(sender), ENotWinner);

    let CommitEntry { bond, score: _, timestamp: _ } = state.commits.remove(sender);
    transfer::public_transfer(bond.into_coin(ctx), sender);
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

public fun runner_up(state: &AuctionState): Option<address> {
    state.runner_up
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

/// Get ticket's accumulated actual surplus.
public fun ticket_actual_surplus(ticket: &SettlementTicket): u64 {
    ticket.actual_surplus
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

public fun is_aborted_phase(state: &AuctionState): bool {
    state.phase == AuctionPhase::Aborted
}

// === Getters ===

/// Get next batch ID (for monitoring/indexing).
public fun next_batch_id(batch_state: &BatchRegistry): u64 {
    batch_state.next_batch_id
}

// === Test Helpers ===

#[test_only]
public fun create_batch_state_for_testing(ctx: &mut TxContext): BatchRegistry {
    BatchRegistry {
        id: object::new(ctx),
        next_batch_id: 0,
    }
}

#[test_only]
public fun destroy_batch_state_for_testing(state: BatchRegistry) {
    let BatchRegistry { id, next_batch_id: _ } = state;
    object::delete(id);
}

#[test_only]
public fun create_ticket_for_testing(batch_id: u64, committed_score: u64): SettlementTicket {
    SettlementTicket { batch_id, intent_ids: vec_set::empty(), committed_score, actual_surplus: 0 }
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
