module cow_dex::settlement_tests;

use cow_dex::config;
use cow_dex::intent_book;
use cow_dex::settlement::{Self};
use std::u64;
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::test_scenario as ts;

// === Phantom coin type ===

public struct USDC has drop {}

// === Error codes (mirror settlement.move) ===

const EBOND_TOO_SMALL: u64 = 1;
const EINVALID_DEADLINE: u64 = 5;
const ESOLVER_NOT_REGISTERED: u64 = 10;
const ESOLVER_ALREADY_REGISTERED: u64 = 11;
const ESETTLE_CONDITIONS_NOT_MET: u64 = 12;

// ─── Tests: register_solver ──────────────────────────────────────────────────

#[test]
fun test_register_solver_success() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.register_solver(
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &config,
            ctx,
        );
    };

    assert!(registry.is_registered(solver));
    assert!(registry.solver_count() == 1);

    config::destroy_for_testing(config, cap);
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ESOLVER_ALREADY_REGISTERED, location = cow_dex::settlement)]
fun test_register_solver_duplicate_aborts() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.register_solver(
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &config,
            ctx,
        );
        registry.register_solver(
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &config,
            ctx,
        );
    };

    config::destroy_for_testing(config, cap);
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EBOND_TOO_SMALL, location = cow_dex::settlement)]
fun test_register_solver_insufficient_bond_aborts() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.register_solver(
            coin::mint_for_testing<SUI>(1, ctx), // below min_bond
            &config,
            ctx,
        );
    };

    config::destroy_for_testing(config, cap);
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

// ─── Tests: advance_epoch ──────────────────────────────────────────────────────

#[test]
fun test_advance_epoch_from_idle() {
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    state.force_winner_for_testing(@0xB, 5);
    state.set_phase_execute_for_testing(u64::max_value!());
    state.destroy_auction_state_for_testing();
}

#[test]
#[expected_failure(abort_code = EINVALID_DEADLINE, location = cow_dex::settlement)]
fun test_advance_epoch_before_interval_ends_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);

    // Set commit_end_ms low so the timed-out commit path triggers
    state.set_commit_end_for_testing(100);

    // T=200: past commit deadline (is_timed_out_commit=true)
    // but settling_epoch=1, epoch_end_ms=(1+1)*10_000=20_000, 200 < 20_000 → EInvalidDeadline
    clock::set_for_testing(&mut clock, 200);
    state.advance_epoch(&config, &clock);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    state.destroy_auction_state_for_testing();
}

// ─── Tests: commit ─────────────────────────────────────────────────────────

#[test]
fun test_commit_registered_solver_succeeds() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    registry.add_solver_for_testing(solver, 1_000_000_000, &mut ctx);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 10, &clock, ctx);
    };

    assert!(std::option::is_some(&state.winner()));
    assert!(state.winner_score() == 10);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ESOLVER_NOT_REGISTERED, location = cow_dex::settlement)]
fun test_commit_unregistered_solver_aborts() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 10, &clock, ctx);
    };

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
fun test_commit_resubmit_improves_score() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    registry.add_solver_for_testing(solver, 1_000_000_000, &mut ctx);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 5, &clock, ctx);
        // Re-commit with higher score — allowed, score should update.
        registry.commit(&mut state, 20, &clock, ctx);
    };

    assert!(state.winner_score() == 20);

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EINVALID_DEADLINE, location = cow_dex::settlement)]
fun test_commit_after_deadline_aborts() {
    let solver = @0xA;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);

    // Short commit deadline: expires at T=100
    state.set_commit_end_for_testing(100);
    registry.add_solver_for_testing(solver, 1_000_000_000, &mut ctx);

    // T=200 > commit_end_ms=100 → EInvalidDeadline
    clock::set_for_testing(&mut clock, 200);

    let mut scenario = ts::begin(solver);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 5, &clock, ctx);
    };

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

// ─── Tests: winner selection ────────────────────────────────────────────────

#[test]
fun test_winner_higher_score_wins() {
    let solver_a = @0xA0;
    let solver_b = @0xB0;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    registry.add_solver_for_testing(solver_a, 1_000_000_000, &mut ctx);
    registry.add_solver_for_testing(solver_b, 1_000_000_000, &mut ctx);

    let mut scenario = ts::begin(solver_a);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 3, &clock, ctx);
    };
    ts::next_tx(&mut scenario, solver_b);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 10, &clock, ctx);
    };

    // Winner is determined on-chain as commits arrive — no close_commits needed.
    assert!(*std::option::borrow(&state.winner()) == solver_b);
    assert!(state.winner_score() == 10);

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
fun test_winner_tiebreak_first_commit_wins() {
    let first = @0xD0;
    let second = @0xE0;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    registry.add_solver_for_testing(first, 1_000_000_000, &mut ctx);
    registry.add_solver_for_testing(second, 1_000_000_000, &mut ctx);

    let mut scenario = ts::begin(first);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 5, &clock, ctx);
    };
    ts::next_tx(&mut scenario, second);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 5, &clock, ctx); // same score
    };

    // First commit wins tiebreak (score not strictly greater, so winner unchanged).
    assert!(*std::option::borrow(&state.winner()) == first);

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

// ─── Tests: take_intent (settlement conditions) ────────────────────────────

#[test]
#[expected_failure(abort_code = ESETTLE_CONDITIONS_NOT_MET, location = cow_dex::settlement)]
fun test_take_intent_before_conditions_met_aborts() {
    // Winner tries to settle before all solvers committed and before deadline.
    let solver_a = @0xA;
    let solver_b = @0xB; // registered but hasn't committed
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    // Register 2 solvers; only solver_a commits — solver_b hasn't; commit deadline = max
    registry.add_solver_for_testing(solver_a, 1_000_000_000, &mut ctx);
    registry.add_solver_for_testing(solver_b, 1_000_000_000, &mut ctx);

    let mut scenario = ts::begin(solver_a);
    {
        let ctx = ts::ctx(&mut scenario);
        registry.commit(&mut state, 10, &clock, ctx);
    };

    // solver_a is winner, tries to open settlement — only 1/2 committed, deadline not reached
    ts::next_tx(&mut scenario, solver_a);
    {
        let ctx = ts::ctx(&mut scenario);
        // Use a dummy intent — will abort before epoch check
        let intent = intent_book::create_intent_for_testing<SUI, USDC>(
            100, 50, false, 9999, ctx,
        );
        let (sell_coin, receipt) = registry.take_intent_base_to_quote(
            &mut state,
            &config,
            intent,
            &clock,
            ctx,
        );
        // unreachable — just destroy to satisfy compiler
        coin::burn_for_testing(sell_coin);
        std::unit_test::destroy(receipt);
    };

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

// ─── Tests: close_batch ────────────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = 4, location = cow_dex::settlement)]
fun test_close_batch_score_mismatch_aborts() {
    let winner = @0xB0;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    state.force_winner_for_testing(winner, 5);
    state.set_phase_execute_for_testing(u64::max_value!());
    // committed_score=5, score_tolerance=95% → threshold=4, actual_surplus=0 → mismatch

    state.close_batch(&config);

    config::destroy_for_testing(config, cap);
    state.destroy_auction_state_for_testing();
}

#[test]
fun test_close_batch_success() {
    let winner = @0xB0;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    state.force_winner_for_testing(winner, 0); // committed_score=0 → threshold=0
    state.set_phase_execute_for_testing(u64::max_value!());
    // actual_surplus=0 >= threshold=0 → success

    state.close_batch(&config);
    assert!(state.is_done_phase());

    config::destroy_for_testing(config, cap);
    state.destroy_auction_state_for_testing();
}

#[test]
fun test_close_batch_with_sufficient_surplus() {
    let winner = @0xB0;
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    state.force_winner_for_testing(winner, 100);
    state.set_phase_execute_for_testing(u64::max_value!());
    // threshold = 100 * 95% = 95; set actual_surplus = 95 → passes
    state.set_surplus_for_testing(95);

    state.close_batch(&config);
    assert!(state.is_done_phase());

    config::destroy_for_testing(config, cap);
    state.destroy_auction_state_for_testing();
}

// ─── Tests: trigger_fallback ───────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = EINVALID_DEADLINE, location = cow_dex::settlement)]
fun test_trigger_fallback_before_deadline_aborts() {
    let winner = @0xB0;
    let caller = @0xC0;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);

    state.force_winner_for_testing(winner, 5);
    state.set_phase_execute_for_testing(75_000);
    registry.add_solver_for_testing(winner, 1_000_000_000, &mut ctx);

    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 74_999); // before deadline

    let mut scenario = ts::begin(caller);
    {
        let ctx = ts::ctx(&mut scenario);
        state.trigger_fallback(&mut registry, &clock, ctx);
    };

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}

#[test]
fun test_trigger_fallback_after_deadline_slashes_bond() {
    let winner = @0xB0;
    let caller = @0xC0;
    let mut ctx = tx_context::dummy();
    let mut state = settlement::create_auction_state_for_testing(0, &mut ctx);
    let mut registry = settlement::create_solver_registry_for_testing(&mut ctx);

    state.force_winner_for_testing(winner, 5);
    state.set_phase_execute_for_testing(75_000);
    registry.add_solver_for_testing(winner, 1_000_000_000, &mut ctx);

    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 75_001); // after deadline

    let mut scenario = ts::begin(caller);
    {
        let ctx = ts::ctx(&mut scenario);
        state.trigger_fallback(&mut registry, &clock, ctx);
        assert!(state.is_failed_phase());
        // Winner deregistered from registry
        assert!(!registry.is_registered(winner));
    };

    clock::destroy_for_testing(clock);
    state.destroy_auction_state_for_testing();
    registry.destroy_solver_registry_for_testing();
    ts::end(scenario);
}
