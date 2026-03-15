module cow_dex::intent_book;

use std::type_name::{Self, TypeName};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::Coin;
use sui::event::emit;

// === Errors ===
const EDeadlineInPast: u64 = 0;
const ENotIntentOwner: u64 = 1;
const ENotPartialFillable: u64 = 3;
const EFillExceedsRemaining: u64 = 4;

// === Events ===

/// Emitted when user creates a new intent.
public struct IntentCreatedEvent has copy, drop {
    intent_id: ID,
    owner: address,
    sell_type: TypeName,
    buy_type: TypeName,
    sell_amount: u64,
    min_amount_out: u64,
    partial_fillable: bool,
    deadline: u64,
}

/// Emitted when user cancels an intent.
public struct IntentCancelledEvent has copy, drop {
    intent_id: ID,
    owner: address,
    sell_amount: u64,
}

// === Structs ===

/// Shared object - user's coins locked inside until settlement or cancellation.
///
/// * `id`: Shared object ID.
/// * `owner`: User address.
/// * `sell_balance`: Locked coins of type SellCoin.
/// * `min_amount_out`: User's minimum acceptable output.
/// * `partial_fillable`: Whether this intent allows partial fills.
/// * `filled_amount`: How much has been filled so far (in SellCoin units).
/// * `deadline`: Unix milliseconds - intent expires after this.
public struct Intent<phantom SellCoin, phantom BuyCoin> has key {
    id: UID,
    owner: address,
    sell_balance: Balance<SellCoin>,
    min_amount_out: u64,
    partial_fillable: bool,
    filled_amount: u64,
    deadline: u64,
}

// === Package-visible functions (called via settlement module) ===

/// Create a new intent, lock coins, share on-chain. Returns the intent ID.
/// Called by settlement::submit_intent - not directly by users.
public(package) fun create_intent<SellCoin, BuyCoin>(
    coin: Coin<SellCoin>,
    min_amount_out: u64,
    partial_fillable: bool,
    deadline: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    let current_time_ms = clock.timestamp_ms();
    assert!(deadline > current_time_ms, EDeadlineInPast);

    let owner = ctx.sender();
    let sell_amount = coin.value();
    let sell_balance = coin.into_balance();

    let intent = Intent<SellCoin, BuyCoin> {
        id: object::new(ctx),
        owner,
        sell_balance,
        min_amount_out,
        partial_fillable,
        filled_amount: 0,
        deadline,
    };

    let intent_id = intent.id.to_inner();
    transfer::share_object(intent);

    emit(IntentCreatedEvent {
        intent_id,
        owner,
        sell_type: type_name::with_defining_ids<SellCoin>(),
        buy_type: type_name::with_defining_ids<BuyCoin>(),
        sell_amount,
        min_amount_out,
        partial_fillable,
        deadline,
    });

    intent_id
}

/// Cancel an intent, return coins to owner.
public(package) fun cancel_intent<SellCoin, BuyCoin>(
    intent: Intent<SellCoin, BuyCoin>,
    ctx: &mut TxContext,
) {
    let sell_amount = intent.sell_balance.value();
    let intent_id = intent.id.to_inner();
    let Intent<SellCoin, BuyCoin> { id, owner, sell_balance, .. } = intent;

    assert!(owner == ctx.sender(), ENotIntentOwner);

    object::delete(id);
    transfer::public_transfer(sell_balance.into_coin(ctx), owner);

    emit(IntentCancelledEvent { intent_id, owner, sell_amount });
}

/// Consume intent during full settlement.
public(package) fun consume_intent<SellCoin, BuyCoin>(
    intent: Intent<SellCoin, BuyCoin>,
): (address, Balance<SellCoin>, u64) {
    let Intent<SellCoin, BuyCoin> {
        id,
        owner,
        sell_balance,
        min_amount_out,
        ..,
    } = intent;

    object::delete(id);
    (owner, sell_balance, min_amount_out)
}

/// Partially fill an intent during settlement. Intent stays alive.
///
/// proportional_min_out = min_amount_out * fill_amount / original_sell_amount
public(package) fun consume_intent_partial<SellCoin, BuyCoin>(
    intent: &mut Intent<SellCoin, BuyCoin>,
    fill_amount: u64,
): (address, Balance<SellCoin>, u64) {
    assert!(intent.partial_fillable, ENotPartialFillable);
    let remaining = intent.sell_balance.value();
    assert!(fill_amount > 0 && fill_amount <= remaining, EFillExceedsRemaining);

    let original_sell_amount = remaining + intent.filled_amount;
    let proportional_min_out =
        (intent.min_amount_out as u128) * (fill_amount as u128)
        / (original_sell_amount as u128);

    let partial_balance = intent.sell_balance.split(fill_amount);
    intent.filled_amount = intent.filled_amount + fill_amount;

    (intent.owner, partial_balance, (proportional_min_out as u64))
}

// === Getters ===

public fun owner<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): address {
    intent.owner
}

public fun sell_amount<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.sell_balance.value()
}

public fun min_amount_out<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.min_amount_out
}

public fun deadline<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.deadline
}

public fun partial_fillable<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): bool {
    intent.partial_fillable
}

public fun filled_amount<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.filled_amount
}

public fun intent_id<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): ID {
    intent.id.to_inner()
}

// === Test Helpers ===

#[test_only]
public fun create_intent_for_testing<SellCoin, BuyCoin>(
    sell_amount: u64,
    min_amount_out: u64,
    partial_fillable: bool,
    deadline: u64,
    ctx: &mut TxContext,
): Intent<SellCoin, BuyCoin> {
    Intent<SellCoin, BuyCoin> {
        id: object::new(ctx),
        owner: ctx.sender(),
        sell_balance: balance::create_for_testing<SellCoin>(sell_amount),
        min_amount_out,
        partial_fillable,
        filled_amount: 0,
        deadline,
    }
}
