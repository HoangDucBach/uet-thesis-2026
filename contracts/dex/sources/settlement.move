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
const ENotInBatch: u64 = 6;
const ESolverNotRegistered: u64 = 10;
const ESolverAlreadyRegistered: u64 = 11;
const ESettleConditionsNotMet: u64 = 12;

// === Constants ===

const SLIPPAGE_TOLERANCE_NUM: u128 = 99;
const SLIPPAGE_TOLERANCE_DENOM: u128 = 100;

// === Enums ===

public enum AuctionPhase has copy, drop, store {
    Idle,
    Commit,
    Execute,
    Done,
    Failed,
    Aborted,
}

// === Structs ===

/// Global solver registry (singleton, Shared Object).
public struct SolverRegistry has key {
    id: UID,
    solvers: VecSet<address>,
    bonds: Table<address, Balance<SUI>>,
}

/// Global auction state machine.
///
/// * `current_epoch_id`: The epoch currently being settled.
/// * `phase`: Current auction phase.
/// * `commit_end_ms`: Deadline for commit phase.
/// * `execute_deadline_ms`: Deadline for winner to execute settlement.
/// * `committed`: Set of solver addresses that have committed this epoch.
/// * `winner`, `winner_score`, `runner_up`, `runner_up_score`: Leaderboard.
/// * `current_epoch_surplus`: Accumulated surplus from settle_intent_* calls.
/// * `intent_ids`: All intent IDs registered in the current batch.
public struct AuctionState has key {
    id: UID,
    current_epoch_id: u64,
    phase: AuctionPhase,
    commit_end_ms: u64,
    execute_deadline_ms: u64,
    committed: VecSet<address>,
    winner: Option<address>,
    winner_score: u64,
    runner_up: Option<address>,
    runner_up_score: u64,
    current_epoch_surplus: u64,
    intent_ids: VecSet<ID>,
}

/// Hot Potato. Created by take_intent_*(), must be consumed by settle_intent_*().
public struct IntentReceipt<phantom Sell, phantom Buy> {
    owner: address,
    sell_amount: u64,
    min_amount_out: u64,
}

// === Events ===

public struct EpochStartedEvent has copy, drop {
    epoch_id: u64,
    commit_end_ms: u64,
}

public struct WinnerSelectedEvent has copy, drop {
    epoch_id: u64,
    winner: address,
    winner_score: u64,
    runner_up: Option<address>,
    runner_up_score: u64,
}

public struct EpochAbortedEvent has copy, drop {
    epoch_id: u64,
}

public struct SettlementCompleteEvent has copy, drop {
    epoch_id: u64,
    winner: address,
    actual_surplus: u64,
    committed_score: u64,
}

public struct FallbackTriggeredEvent has copy, drop {
    epoch_id: u64,
    winner: address,
    bond_slashed: u64,
}

public struct SolverRegisteredEvent has copy, drop {
    solver: address,
    bond_amount: u64,
}

public struct SolverDeregisteredEvent has copy, drop {
    solver: address,
}

// === Initialization ===

fun init(ctx: &mut TxContext) {
    transfer::share_object(AuctionState {
        id: object::new(ctx),
        current_epoch_id: 0,
        phase: AuctionPhase::Idle,
        commit_end_ms: 0,
        execute_deadline_ms: 0,
        committed: vec_set::empty(),
        winner: option::none(),
        winner_score: 0,
        runner_up: option::none(),
        runner_up_score: 0,
        current_epoch_surplus: 0,
        intent_ids: vec_set::empty(),
    });

    transfer::share_object(SolverRegistry {
        id: object::new(ctx),
        solvers: vec_set::empty(),
        bonds: table::new(ctx),
    });
}

// === Intent Lifecycle ===

/// Submit a new intent into the current batch.
public fun submit_intent<SellCoin, BuyCoin>(
    state: &mut AuctionState,
    coin: Coin<SellCoin>,
    min_amount_out: u64,
    partial_fillable: bool,
    deadline: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let id = intent_book::create_intent<SellCoin, BuyCoin>(
        coin,
        min_amount_out,
        partial_fillable,
        deadline,
        clock,
        ctx,
    );
    state.intent_ids.insert(id);
}

/// Cancel an intent and retrieve coins.
public fun cancel_intent<SellCoin, BuyCoin>(
    state: &mut AuctionState,
    intent: Intent<SellCoin, BuyCoin>,
    ctx: &mut TxContext,
) {
    let id = intent.intent_id();
    state.intent_ids.remove(&id);
    intent.cancel_intent(ctx);
}

// === Solver Registration ===

public fun register_solver(
    registry: &mut SolverRegistry,
    bond: Coin<SUI>,
    config: &GlobalConfig,
    ctx: &TxContext,
) {
    let solver = ctx.sender();
    assert!(!registry.solvers.contains(&solver), ESolverAlreadyRegistered);
    assert!(bond.value() >= config.min_bond(), EBondTooSmall);

    let bond_amount = bond.value();
    registry.solvers.insert(solver);
    registry.bonds.add(solver, bond.into_balance());

    emit(SolverRegisteredEvent { solver, bond_amount });
}

#[allow(lint(self_transfer))]
public fun deregister_solver(
    registry: &mut SolverRegistry,
    state: &AuctionState,
    ctx: &mut TxContext,
) {
    assert!(is_terminal_phase(state), EWrongPhase);

    let solver = ctx.sender();
    assert!(registry.solvers.contains(&solver), ESolverNotRegistered);

    registry.solvers.remove(&solver);
    let bond_bal = registry.bonds.remove(solver);
    transfer::public_transfer(bond_bal.into_coin(ctx), solver);

    emit(SolverDeregisteredEvent { solver });
}

// === Epoch Lifecycle ===

/// Advance to the next epoch's commit phase (permissionless).
///
/// Clears committed set and resets phase to Commit.
/// Does NOT clear intent_ids - partial fill intents carry over automatically.
public fun advance_epoch(state: &mut AuctionState, config: &GlobalConfig, clock: &Clock) {
    let now = clock.timestamp_ms();
    let is_timed_out_commit = state.phase == AuctionPhase::Commit && now >= state.commit_end_ms;

    assert!(is_terminal_phase(state) || is_timed_out_commit, EWrongPhase);

    let settling_epoch = if (state.phase == AuctionPhase::Idle) {
        state.current_epoch_id
    } else {
        state.current_epoch_id + 1
    };

    let epoch_end_ms = (settling_epoch + 1) * config.epoch_duration_ms();
    assert!(now >= epoch_end_ms, EInvalidDeadline);

    if (is_timed_out_commit) {
        emit(EpochAbortedEvent { epoch_id: state.current_epoch_id });
    };

    state.current_epoch_id = settling_epoch;
    state.phase = AuctionPhase::Commit;
    state.committed = vec_set::empty();
    state.commit_end_ms = now + config.commit_duration_ms();
    state.execute_deadline_ms = 0;
    state.winner = option::none();
    state.runner_up = option::none();
    state.winner_score = 0;
    state.runner_up_score = 0;
    state.current_epoch_surplus = 0;
    // intent_ids intentionally NOT cleared - partial fills carry over

    emit(EpochStartedEvent {
        epoch_id: settling_epoch,
        commit_end_ms: state.commit_end_ms,
    });
}

/// Submit a score commitment during commit phase.
public fun commit(
    registry: &SolverRegistry,
    state: &mut AuctionState,
    score: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(state.phase == AuctionPhase::Commit, EWrongPhase);
    let now = clock.timestamp_ms();
    assert!(now < state.commit_end_ms, EInvalidDeadline);

    let sender = ctx.sender();
    assert!(registry.solvers.contains(&sender), ESolverNotRegistered);

    if (!state.committed.contains(&sender)) {
        state.committed.insert(sender);
    };

    // Always update leaderboard if this score is better.
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
        } else if (score > state.runner_up_score && sender != current_winner) {
            state.runner_up = option::some(sender);
            state.runner_up_score = score;
        };
    };
}

// === Settlement ===

/// Take all sell assets from intent selling Base (full fill).
/// Removes intent ID from AuctionState.intent_ids.
/// Returns (Coin<Base>, IntentReceipt) - receipt must be consumed by settle_intent_base_to_quote.
public fun take_intent_base_to_quote<Base, Quote>(
    registry: &SolverRegistry,
    state: &mut AuctionState,
    config: &GlobalConfig,
    intent: Intent<Base, Quote>,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<Base>, IntentReceipt<Base, Quote>) {
    assert_settle_authorized(registry, state, config, clock, ctx);
    let id = intent.intent_id();
    assert!(state.intent_ids.contains(&id), ENotInBatch);
    state.intent_ids.remove(&id);

    let (owner, sell_balance, min_amount_out) = intent.consume_intent();
    let receipt = IntentReceipt<Base, Quote> {
        owner,
        sell_amount: sell_balance.value(),
        min_amount_out,
    };
    (sell_balance.into_coin(ctx), receipt)
}

/// Take all sell assets from intent selling Quote (full fill).
public fun take_intent_quote_to_base<Base, Quote>(
    registry: &SolverRegistry,
    state: &mut AuctionState,
    config: &GlobalConfig,
    intent: Intent<Quote, Base>,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<Quote>, IntentReceipt<Quote, Base>) {
    assert_settle_authorized(registry, state, config, clock, ctx);
    let id = intent.intent_id();
    assert!(state.intent_ids.contains(&id), ENotInBatch);
    state.intent_ids.remove(&id);

    let (owner, sell_balance, min_amount_out) = intent.consume_intent();
    let receipt = IntentReceipt<Quote, Base> {
        owner,
        sell_amount: sell_balance.value(),
        min_amount_out,
    };
    (sell_balance.into_coin(ctx), receipt)
}

/// Take partial sell assets from intent selling Base.
/// Intent stays alive; its ID remains in intent_ids for the next epoch.
public fun take_intent_partial_base_to_quote<Base, Quote>(
    registry: &SolverRegistry,
    state: &mut AuctionState,
    config: &GlobalConfig,
    intent: &mut Intent<Base, Quote>,
    fill_amount: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<Base>, IntentReceipt<Base, Quote>) {
    assert_settle_authorized(registry, state, config, clock, ctx);
    let id = intent.intent_id();
    assert!(state.intent_ids.contains(&id), ENotInBatch);
    // Do NOT remove from intent_ids - remaining balance carries over to next epoch

    let (owner, partial_balance, proportional_min_out) = intent.consume_intent_partial(fill_amount);
    let receipt = IntentReceipt<Base, Quote> {
        owner,
        sell_amount: fill_amount,
        min_amount_out: proportional_min_out,
    };
    (partial_balance.into_coin(ctx), receipt)
}

/// Take partial sell assets from intent selling Quote.
/// Intent stays alive; its ID remains in intent_ids for the next epoch.
public fun take_intent_partial_quote_to_base<Base, Quote>(
    registry: &SolverRegistry,
    state: &mut AuctionState,
    config: &GlobalConfig,
    intent: &mut Intent<Quote, Base>,
    fill_amount: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<Quote>, IntentReceipt<Quote, Base>) {
    assert_settle_authorized(registry, state, config, clock, ctx);
    let id = intent.intent_id();
    assert!(state.intent_ids.contains(&id), ENotInBatch);
    // Do NOT remove from intent_ids - remaining balance carries over to next epoch

    let (owner, partial_balance, proportional_min_out) = intent.consume_intent_partial(fill_amount);
    let receipt = IntentReceipt<Quote, Base> {
        owner,
        sell_amount: fill_amount,
        min_amount_out: proportional_min_out,
    };
    (partial_balance.into_coin(ctx), receipt)
}

/// Settle an intent that sold Base - verify payout, pay user, accumulate surplus.
public fun settle_intent_base_to_quote<Base, Quote>(
    state: &mut AuctionState,
    receipt: IntentReceipt<Base, Quote>,
    payout: Coin<Quote>,
    pool: &DeepbookPool<Base, Quote>,
    clock: &Clock,
) {
    let IntentReceipt<Base, Quote> { owner, sell_amount, min_amount_out } = receipt;
    let price_floor = calculate_price_floor(pool, true, sell_amount, min_amount_out, clock);
    assert!(payout.value() >= price_floor, EClearingPriceMismatch);
    state.current_epoch_surplus = state.current_epoch_surplus + (payout.value() - price_floor);
    transfer::public_transfer(payout, owner);
}

/// Settle an intent that sold Quote - verify payout, pay user, accumulate surplus.
public fun settle_intent_quote_to_base<Base, Quote>(
    state: &mut AuctionState,
    receipt: IntentReceipt<Quote, Base>,
    payout: Coin<Base>,
    pool: &DeepbookPool<Base, Quote>,
    clock: &Clock,
) {
    let IntentReceipt<Quote, Base> { owner, sell_amount, min_amount_out } = receipt;
    let price_floor = calculate_price_floor(pool, false, sell_amount, min_amount_out, clock);
    assert!(payout.value() >= price_floor, EClearingPriceMismatch);
    state.current_epoch_surplus = state.current_epoch_surplus + (payout.value() - price_floor);
    transfer::public_transfer(payout, owner);
}

/// Close the current settlement batch.
/// Verifies accumulated surplus meets committed score threshold, marks epoch Done.
public fun close_batch(state: &mut AuctionState, config: &GlobalConfig) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);

    let threshold =
        ((state.winner_score as u128) * (config.score_tolerance_bps() as u128) / 10_000u128) as u64;
    assert!(state.current_epoch_surplus >= threshold, EScoreMismatch);

    let winner = *state.winner.borrow();
    state.phase = AuctionPhase::Done;

    emit(SettlementCompleteEvent {
        epoch_id: state.current_epoch_id,
        winner,
        actual_surplus: state.current_epoch_surplus,
        committed_score: state.winner_score,
    });
}

/// Trigger fallback if winner fails to execute within grace period (permissionless).
#[allow(lint(self_transfer))]
public fun trigger_fallback(
    state: &mut AuctionState,
    registry: &mut SolverRegistry,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
    assert!(clock.timestamp_ms() > state.execute_deadline_ms, EInvalidDeadline);

    let winner = *state.winner.borrow();
    let bond_bal = registry.bonds.remove(winner);
    let slashed_amount = bond_bal.value();
    registry.solvers.remove(&winner);

    transfer::public_transfer(bond_bal.into_coin(ctx), ctx.sender());
    state.phase = AuctionPhase::Failed;

    emit(FallbackTriggeredEvent {
        epoch_id: state.current_epoch_id,
        winner,
        bond_slashed: slashed_amount,
    });
}

// === Getters ===

public fun phase(state: &AuctionState): AuctionPhase { state.phase }

public fun current_epoch_id(state: &AuctionState): u64 { state.current_epoch_id }

public fun winner(state: &AuctionState): Option<address> { state.winner }

public fun runner_up(state: &AuctionState): Option<address> { state.runner_up }

public fun winner_score(state: &AuctionState): u64 { state.winner_score }

public fun commit_end_ms(state: &AuctionState): u64 { state.commit_end_ms }

public fun execute_deadline_ms(state: &AuctionState): u64 { state.execute_deadline_ms }

public fun current_epoch_surplus(state: &AuctionState): u64 { state.current_epoch_surplus }

public fun intent_count(state: &AuctionState): u64 { state.intent_ids.length() }

public fun has_intent(state: &AuctionState, id: ID): bool { state.intent_ids.contains(&id) }

public fun is_idle_phase(state: &AuctionState): bool { state.phase == AuctionPhase::Idle }

public fun is_commit_phase(state: &AuctionState): bool { state.phase == AuctionPhase::Commit }

public fun is_execute_phase(state: &AuctionState): bool { state.phase == AuctionPhase::Execute }

public fun is_done_phase(state: &AuctionState): bool { state.phase == AuctionPhase::Done }

public fun is_failed_phase(state: &AuctionState): bool { state.phase == AuctionPhase::Failed }

public fun is_aborted_phase(state: &AuctionState): bool { state.phase == AuctionPhase::Aborted }

public fun solver_count(registry: &SolverRegistry): u64 { registry.solvers.length() }

public fun is_registered(registry: &SolverRegistry, solver: address): bool {
    registry.solvers.contains(&solver)
}

// === Internal helpers ===

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
        let flipped_u128 = (scaling * scaling) / (pool_mid_price as u128);
        assert!(flipped_u128 <= math::max_u64(), EClearingPriceMismatch);
        (flipped_u128 as u64)
    };
    let fair_out_u128 = (amount as u128) * (mid_price as u128) / scaling;
    assert!(fair_out_u128 <= math::max_u64(), EClearingPriceMismatch);
    let fair_out = (fair_out_u128 as u64);

    let slippage_u128 = (fair_out as u128) * SLIPPAGE_TOLERANCE_NUM / SLIPPAGE_TOLERANCE_DENOM;
    assert!(slippage_u128 <= math::max_u64(), EClearingPriceMismatch);
    (u64::max(user_min_out, (slippage_u128 as u64)))
}

fun is_terminal_phase(state: &AuctionState): bool {
    state.phase == AuctionPhase::Idle ||
    state.phase == AuctionPhase::Done ||
    state.phase == AuctionPhase::Failed ||
    state.phase == AuctionPhase::Aborted
}

/// Check settlement authorization and auto-transition Commit → Execute on first take_intent call.
fun assert_settle_authorized(
    registry: &SolverRegistry,
    state: &mut AuctionState,
    config: &GlobalConfig,
    clock: &Clock,
    ctx: &TxContext,
) {
    let now = clock.timestamp_ms();
    let sender = ctx.sender();

    if (state.phase == AuctionPhase::Commit) {
        let all_committed = state.committed.length() == registry.solvers.length();
        let time_expired = now >= state.commit_end_ms;
        assert!(all_committed || time_expired, ESettleConditionsNotMet);

        assert!(state.winner.is_some(), ENotWinner);
        let winner = *state.winner.borrow();
        assert!(winner == sender, ENotWinner);

        state.phase = AuctionPhase::Execute;
        state.execute_deadline_ms = now + config.grace_period_ms();
        state.current_epoch_surplus = 0;

        emit(WinnerSelectedEvent {
            epoch_id: state.current_epoch_id,
            winner,
            winner_score: state.winner_score,
            runner_up: state.runner_up,
            runner_up_score: state.runner_up_score,
        });
    } else {
        assert!(state.phase == AuctionPhase::Execute, EWrongPhase);
        assert!(now <= state.execute_deadline_ms, EInvalidDeadline);
        let winner = *state.winner.borrow();
        assert!(winner == sender, ENotWinner);
    }
}

// === Test Helpers ===

#[test_only]
public fun create_auction_state_for_testing(epoch_id: u64, ctx: &mut TxContext): AuctionState {
    AuctionState {
        id: object::new(ctx),
        current_epoch_id: epoch_id,
        phase: AuctionPhase::Commit,
        commit_end_ms: u64::max_value!(),
        execute_deadline_ms: 0,
        committed: vec_set::empty(),
        winner: option::none(),
        winner_score: 0,
        runner_up: option::none(),
        runner_up_score: 0,
        current_epoch_surplus: 0,
        intent_ids: vec_set::empty(),
    }
}

#[test_only]
public fun create_solver_registry_for_testing(ctx: &mut TxContext): SolverRegistry {
    SolverRegistry {
        id: object::new(ctx),
        solvers: vec_set::empty(),
        bonds: table::new(ctx),
    }
}

#[test_only]
public fun add_solver_for_testing(
    registry: &mut SolverRegistry,
    solver: address,
    bond_amount: u64,
    _ctx: &mut TxContext,
) {
    use sui::balance;
    registry.solvers.insert(solver);
    registry.bonds.add(solver, balance::create_for_testing<SUI>(bond_amount));
}

#[test_only]
public fun set_commit_end_for_testing(state: &mut AuctionState, commit_end_ms: u64) {
    state.commit_end_ms = commit_end_ms;
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

#[test_only]
public fun set_surplus_for_testing(state: &mut AuctionState, surplus: u64) {
    state.current_epoch_surplus = surplus;
}

#[test_only]
public fun add_intent_id_for_testing(state: &mut AuctionState, id: ID) {
    state.intent_ids.insert(id);
}

#[test_only]
public fun share_state_for_testing(state: AuctionState) {
    transfer::share_object(state);
}

#[test_only]
public fun share_registry_for_testing(registry: SolverRegistry) {
    transfer::share_object(registry);
}

#[test_only]
public fun destroy_auction_state_for_testing(state: AuctionState) {
    std::unit_test::destroy(state);
}

#[test_only]
public fun destroy_solver_registry_for_testing(registry: SolverRegistry) {
    std::unit_test::destroy(registry);
}
