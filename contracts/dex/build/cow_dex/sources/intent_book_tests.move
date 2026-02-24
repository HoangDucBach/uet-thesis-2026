module cow_dex::intent_book_tests;

use cow_dex::intent_book::{Self, Intent, IntentCap};
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::test_scenario as ts;

// === Coin types for testing ===

public struct USDC has drop {}

// === Tests: create_intent ===

#[test]
fun test_create_intent_fields() {
    let user = @0xA;
    let mut scenario = ts::begin(user);

    {
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);

        let cap: IntentCap = intent_book::create_intent<SUI, USDC>(
            coin::mint_for_testing<SUI>(500, ctx),
            200,
            1000,
            &clock,
            ctx,
        );

        clock::destroy_for_testing(clock);
        transfer::public_transfer(cap, user);
    };

    ts::next_tx(&mut scenario, user);
    {
        let cap = ts::take_from_sender<IntentCap>(&scenario);
        let intent = ts::take_shared<Intent<SUI, USDC>>(&scenario);

        assert!(intent_book::sell_amount(&intent) == 500);
        assert!(intent_book::min_amount_out(&intent) == 200);
        assert!(intent_book::deadline(&intent) == 1000);
        assert!(intent_book::owner(&intent) == user);
        assert!(std::option::is_none(&intent_book::batch_id(&intent)));

        ts::return_shared(intent);
        ts::return_to_sender(&scenario, cap);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = 0, location = cow_dex::intent_book)]
fun test_create_intent_deadline_in_past_aborts() {
    let user = @0xA;
    let mut scenario = ts::begin(user);
    {
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 5000);

        let cap = intent_book::create_intent<SUI, USDC>(
            coin::mint_for_testing<SUI>(100, ctx),
            50,
            4999,
            &clock,
            ctx,
        );

        clock::destroy_for_testing(clock);
        transfer::public_transfer(cap, user);
    };
    ts::end(scenario);
}

// === Tests: cancel_intent ===

#[test]
fun test_cancel_intent_returns_coins() {
    let user = @0xA;
    let mut scenario = ts::begin(user);

    {
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);
        let cap = intent_book::create_intent<SUI, USDC>(
            coin::mint_for_testing<SUI>(1000, ctx),
            500,
            9999,
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        transfer::public_transfer(cap, user);
    };

    ts::next_tx(&mut scenario, user);
    {
        let cap = ts::take_from_sender<IntentCap>(&scenario);
        let intent = ts::take_shared<Intent<SUI, USDC>>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        intent_book::cancel_intent<SUI, USDC>(cap, intent, ctx);
    };

    ts::next_tx(&mut scenario, user);
    {
        let returned_coin = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
        assert!(coin::value(&returned_coin) == 1000);
        ts::return_to_sender(&scenario, returned_coin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = 1, location = cow_dex::intent_book)]
fun test_cancel_intent_wrong_owner_aborts() {
    let user_a = @0xA;
    let user_b = @0xB;
    let mut scenario = ts::begin(user_a);

    {
        let ctx = ts::ctx(&mut scenario);
        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 0);
        let cap = intent_book::create_intent<SUI, USDC>(
            coin::mint_for_testing<SUI>(1000, ctx),
            500,
            9999,
            &clock,
            ctx,
        );
        clock::destroy_for_testing(clock);
        transfer::public_transfer(cap, user_b);
    };

    ts::next_tx(&mut scenario, user_b);
    {
        let cap = ts::take_from_sender<IntentCap>(&scenario);
        let intent = ts::take_shared<Intent<SUI, USDC>>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        intent_book::cancel_intent<SUI, USDC>(cap, intent, ctx);
    };

    ts::end(scenario);
}

// === Tests: consume_intent ===

#[test]
fun test_consume_intent_returns_correct_fields() {
    let user = @0xA;
    let mut scenario = ts::begin(user);
    let ctx = ts::ctx(&mut scenario);

    let intent = intent_book::create_intent_for_testing<SUI, USDC>(
        750,
        300,
        9999,
        42,
        ctx,
    );

    assert!(intent_book::sell_amount(&intent) == 750);
    assert!(intent_book::min_amount_out(&intent) == 300);

    let (owner, out_balance, min_out, sell_amount) = intent_book::consume_intent<SUI, USDC>(intent);

    assert!(owner == user);
    assert!(min_out == 300);
    assert!(sell_amount == 750);

    std::unit_test::destroy(out_balance);
    ts::end(scenario);
}

#[test]
fun test_set_batch_id_for_testing() {
    let user = @0xA;
    let mut scenario = ts::begin(user);
    let ctx = ts::ctx(&mut scenario);

    let mut intent = intent_book::create_intent_for_testing<SUI, USDC>(
        100,
        50,
        9999,
        1,
        ctx,
    );

    assert!(*std::option::borrow(&intent_book::batch_id(&intent)) == 1);

    intent_book::set_batch_id_for_testing(&mut intent, 99);
    assert!(*std::option::borrow(&intent_book::batch_id(&intent)) == 99);

    std::unit_test::destroy(intent);
    ts::end(scenario);
}
