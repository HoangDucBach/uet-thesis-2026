module cow_dex::settlement_tests;

use cow_dex::config;
use cow_dex::intent_book;
use cow_dex::settlement::{Self, AuctionState};
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::test_scenario as ts;

// === Phantom coin type ===

public struct USDC has drop {}

// === Error codes ===

const EWRONG_PHASE: u64 = 0;
const EBOND_TOO_SMALL: u64 = 1;
const ECLEARING_PRICE_MISMATCH: u64 = 2;
const ENOT_WINNER: u64 = 3;
const ESCORE_MISMATCH: u64 = 4;
const EINVALID_DEADLINE: u64 = 5;
const EWRONG_BATCH: u64 = 6;
const EDUPLICATE_COMMIT: u64 = 7;

// ─── Tests: open_batch ─────────────────────────────────────────────────────

#[test]
fun test_open_batch_initial_state() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 1000);

    let state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    assert!(settlement::is_commit_phase(&state));
    assert!(settlement::batch_id(&state) == 0);
    assert!(std::option::is_none(&settlement::winner(&state)));
    assert!(settlement::winner_score(&state) == 0);
    assert!(settlement::commit_end_ms(&state) == 1000 + config::default_commit_duration_ms());
    assert!(
        settlement::execute_deadline_ms(&state) ==
        1000 + config::default_commit_duration_ms() + config::default_grace_period_ms(),
    );

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

// ─── Tests: commit ─────────────────────────────────────────────────────────

#[test]
fun test_commit_registers_winner() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );

    assert!(std::option::is_some(&settlement::winner(&state)));
    assert!(settlement::winner_score(&state) == 5);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

#[test]
#[expected_failure(abort_code = EBOND_TOO_SMALL, location = cow_dex::settlement)]
fun test_commit_insufficient_bond_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(999_999_999, &mut ctx),
        &clock,
        &ctx,
    );

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

#[test]
#[expected_failure(abort_code = EINVALID_DEADLINE, location = cow_dex::settlement)]
fun test_commit_after_deadline_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 3000);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

#[test]
#[expected_failure(abort_code = EDUPLICATE_COMMIT, location = cow_dex::settlement)]
fun test_commit_duplicate_same_sender_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );
    settlement::commit(
        &config,
        &mut state,
        3,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

// ─── Tests: winner selection with two solvers ───────────────────────────────

#[test]
fun test_winner_selection_higher_score_wins() {
    let admin = @0xA0;
    let winner = @0xB0;
    let loser = @0xC0;

    let mut scenario = ts::begin(admin);
    {
        let ctx = ts::ctx(&mut scenario);
        let (config, cap) = config::create_for_testing(ctx);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);
        let state = settlement::open_batch(&config, 0, vector::empty(), &clock, ctx);
        clock::destroy_for_testing(clock);
        transfer::public_share_object(config);
        settlement::share_state_for_testing(state);
        std::unit_test::destroy(cap);
    };

    ts::next_tx(&mut scenario, winner);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 100);
        settlement::commit(
            &config,
            &mut state,
            10,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, loser);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 200);
        settlement::commit(
            &config,
            &mut state,
            3,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, admin);
    {
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 2001);
        settlement::close_commits(&mut state, &clock);

        assert!(*std::option::borrow(&settlement::winner(&state)) == winner);
        assert!(settlement::winner_score(&state) == 10);

        clock::destroy_for_testing(clock);
        ts::return_shared(state);
    };

    ts::end(scenario);
}

#[test]
fun test_winner_tiebreak_earlier_timestamp_wins() {
    let admin = @0xA0;
    let first = @0xD0;
    let second = @0xE0;

    let mut scenario = ts::begin(admin);
    {
        let ctx = ts::ctx(&mut scenario);
        let (config, cap) = config::create_for_testing(ctx);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);
        let state = settlement::open_batch(&config, 0, vector::empty(), &clock, ctx);
        clock::destroy_for_testing(clock);
        transfer::public_share_object(config);
        settlement::share_state_for_testing(state);
        std::unit_test::destroy(cap);
    };

    ts::next_tx(&mut scenario, first);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 100);
        settlement::commit(
            &config,
            &mut state,
            5,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, second);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 500);
        settlement::commit(
            &config,
            &mut state,
            5,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, admin);
    {
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 2001);
        settlement::close_commits(&mut state, &clock);
        assert!(*std::option::borrow(&settlement::winner(&state)) == first);
        clock::destroy_for_testing(clock);
        ts::return_shared(state);
    };

    ts::end(scenario);
}

// ─── Tests: close_commits ──────────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = EINVALID_DEADLINE, location = cow_dex::settlement)]
fun test_close_commits_before_deadline_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 1999);
    settlement::close_commits(&mut state, &clock);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

// ─── Tests: open_settlement ────────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = ENOT_WINNER, location = cow_dex::settlement)]
fun test_open_settlement_non_winner_aborts() {
    let admin = @0xA0;
    let winner = @0xB0;
    let non_winner = @0xBAD;

    let mut scenario = ts::begin(admin);
    {
        let ctx = ts::ctx(&mut scenario);
        let (config, cap) = config::create_for_testing(ctx);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);
        let state = settlement::open_batch(&config, 0, vector::empty(), &clock, ctx);
        clock::destroy_for_testing(clock);
        transfer::public_share_object(config);
        settlement::share_state_for_testing(state);
        std::unit_test::destroy(cap);
    };

    ts::next_tx(&mut scenario, winner);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 100);
        settlement::commit(
            &config,
            &mut state,
            5,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::set_for_testing(&mut clock, 2001);
        settlement::close_commits(&mut state, &clock);
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, non_winner);
    {
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 3000);
        let ticket = settlement::open_settlement(&mut state, &clock, ctx);
        clock::destroy_for_testing(clock);
        settlement::destroy_ticket_for_testing(ticket);
        ts::return_shared(state);
    };

    ts::end(scenario);
}

// ─── Tests: close_settlement ───────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = ESCORE_MISMATCH, location = cow_dex::settlement)]
fun test_close_settlement_score_mismatch_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );

    clock::set_for_testing(&mut clock, 2001);
    settlement::close_commits(&mut state, &clock);

    clock::set_for_testing(&mut clock, 3000);
    let ticket = settlement::open_settlement(&mut state, &clock, &ctx);

    settlement::close_settlement(&mut state, ticket, &mut ctx);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

// ─── Tests: trigger_fallback ───────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = EINVALID_DEADLINE, location = cow_dex::settlement)]
fun test_trigger_fallback_before_deadline_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );
    clock::set_for_testing(&mut clock, 2001);
    settlement::close_commits(&mut state, &clock);

    clock::set_for_testing(&mut clock, 6999);
    settlement::trigger_fallback(&mut state, &clock, &mut ctx);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

#[test]
fun test_trigger_fallback_after_deadline_slashes_bond() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );
    clock::set_for_testing(&mut clock, 2001);
    settlement::close_commits(&mut state, &clock);

    clock::set_for_testing(&mut clock, 7001);
    settlement::trigger_fallback(&mut state, &clock, &mut ctx);

    assert!(settlement::is_failed_phase(&state));

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

// ─── Tests: claim_refund ───────────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = EWRONG_PHASE, location = cow_dex::settlement)]
fun test_claim_refund_during_commit_phase_aborts() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);
    clock::set_for_testing(&mut clock, 0);

    let mut state = settlement::open_batch(&config, 0, vector::empty(), &clock, &mut ctx);

    clock::set_for_testing(&mut clock, 100);
    settlement::commit(
        &config,
        &mut state,
        5,
        coin::mint_for_testing<SUI>(1_000_000_000, &mut ctx),
        &clock,
        &ctx,
    );

    settlement::claim_refund(&mut state, &mut ctx);

    clock::destroy_for_testing(clock);
    config::destroy_for_testing(config, cap);
    std::unit_test::destroy(state);
}

#[test]
fun test_claim_refund_loser_after_done() {
    let admin = @0xA0;
    let winner = @0xB0;
    let loser = @0xC0;

    let mut scenario = ts::begin(admin);
    {
        let ctx = ts::ctx(&mut scenario);
        let (config, cap) = config::create_for_testing(ctx);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);
        let state = settlement::open_batch(&config, 0, vector::empty(), &clock, ctx);
        clock::destroy_for_testing(clock);
        transfer::public_share_object(config);
        settlement::share_state_for_testing(state);
        std::unit_test::destroy(cap);
    };

    ts::next_tx(&mut scenario, winner);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 100);
        settlement::commit(
            &config,
            &mut state,
            0,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, loser);
    {
        let config = ts::take_shared<config::GlobalConfig>(&scenario);
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 200);
        settlement::commit(
            &config,
            &mut state,
            0,
            coin::mint_for_testing<SUI>(1_000_000_000, ctx),
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        ts::return_shared(config);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, winner);
    {
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 2001);
        settlement::close_commits(&mut state, &clock);
        clock::set_for_testing(&mut clock, 3000);

        let ticket = settlement::open_settlement(&mut state, &clock, ctx);
        settlement::close_settlement(&mut state, ticket, ctx);

        assert!(settlement::is_done_phase(&state));
        clock::destroy_for_testing(clock);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, loser);
    {
        let mut state = ts::take_shared<AuctionState>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        settlement::claim_refund(&mut state, ctx);
        ts::return_shared(state);
    };

    ts::next_tx(&mut scenario, loser);
    {
        let refund = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&refund) == 1_000_000_000);
        ts::return_to_sender(&scenario, refund);
    };

    ts::end(scenario);
}
