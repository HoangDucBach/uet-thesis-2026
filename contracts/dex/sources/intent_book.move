module cow_dex::intent_book;

use std::option;
use std::type_name::{Self, TypeName};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event::emit;

// === Errors ===
const EDeadlineInPast: u64 = 0;
const ENotIntentOwner: u64 = 1;
const EIntentInBatch: u64 = 2;
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

/// Shared object — user's coins locked inside until settlement or cancellation.
///
/// * `id`: Shared object ID.
/// * `batch_id`: Optional — set when assigned to a batch.
/// * `owner`: User address.
/// * `sell_balance`: Locked coins of type SellCoin (its value IS the sell amount).
/// * `min_amount_out`: User's minimum acceptable output.
/// * `deadline`: Unix milliseconds — intent expires after this.
public struct Intent<phantom SellCoin, phantom BuyCoin> has key {
    id: UID,
    batch_id: Option<u64>,
    owner: address,
    sell_balance: Balance<SellCoin>,
    min_amount_out: u64,
    partial_fillable: bool,
    filled_amount: u64,
    deadline: u64,
}

// === Functions ===

/// User creates a new intent, locking coins in a shared object.
///
/// * `coin`: User's coin to trade (type SellCoin).
/// * `min_amount_out`: Minimum acceptable output (in BuyCoin).
/// * `deadline`: Unix milliseconds deadline.
/// * `clock`: Sui clock for deadline validation.
/// * `ctx`: Transaction context.
///
/// Type Parameters:
/// * `SellCoin`: Coin type user is selling.
/// * `BuyCoin`: Coin type user wants to receive.
public fun create_intent<SellCoin, BuyCoin>(
    coin: Coin<SellCoin>,
    min_amount_out: u64,
    partial_fillable: bool,
    deadline: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let current_time_ms = clock.timestamp_ms();
    assert!(deadline > current_time_ms, EDeadlineInPast);

    let owner = ctx.sender();
    let sell_amount = coin.value(); // captured before balance conversion, used in event
    let sell_balance = coin.into_balance();

    let intent = Intent<SellCoin, BuyCoin> {
        id: object::new(ctx),
        batch_id: option::none(),
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
}

/// User cancels their intent, retrieving coins.
///
/// * `cap`: IntentCap.
/// * `intent`: Intent object.
/// * `ctx`: Transaction context.
///
/// Type Parameters:
/// * `SellCoin`: Coin type user is selling.
/// * `BuyCoin`: Coin type user wanted to receive.
public fun cancel_intent<SellCoin, BuyCoin>(
    intent: Intent<SellCoin, BuyCoin>,
    ctx: &mut TxContext,
) {
    let sell_amount = intent.sell_balance.value();
    let intent_id = intent.id.to_inner();
    let Intent<SellCoin, BuyCoin> { id, batch_id, owner, sell_balance, .. } = intent;

    assert!(owner == ctx.sender(), ENotIntentOwner);
    assert!(batch_id.is_none(), EIntentInBatch);

    object::delete(id);

    // Return coins to user
    transfer::public_transfer(sell_balance.into_coin(ctx), owner);

    emit(IntentCancelledEvent {
        intent_id,
        owner,
        sell_amount,
    });
}

/// Consume intent during settlement.
///
/// * `intent`: Intent taken by value (deleted atomically).
/// Returns: (owner address, sell_balance, min_amount_out)
/// Caller derives sell_amount via `balance::value(&sell_balance)`.
///
/// Type Parameters:
/// * `SellCoin`: Coin type user was selling.
/// * `BuyCoin`: Coin type user wanted to receive.
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

    object::delete(id); // shared object deleted — replay impossible
    (owner, sell_balance, min_amount_out)
}

/// Partially fill an intent during settlement.
/// Intent stays alive — NOT deleted. Balance is split, filled_amount updated.
/// Caller must ensure fill_amount > 0 and intent is partial_fillable.
///
/// * `intent`: Mutable reference to the shared Intent.
/// * `fill_amount`: Amount of SellCoin to fill (must be <= remaining balance).
/// Returns: (owner address, partial_sell_balance, proportional_min_out)
///
/// proportional_min_out = min_amount_out * fill_amount / original_sell_amount
/// where original_sell_amount = remaining + already_filled (reconstructed).
public(package) fun consume_intent_partial<SellCoin, BuyCoin>(
    intent: &mut Intent<SellCoin, BuyCoin>,
    fill_amount: u64,
): (address, Balance<SellCoin>, u64) {
    assert!(intent.partial_fillable, ENotPartialFillable);
    let remaining = intent.sell_balance.value();
    assert!(fill_amount > 0 && fill_amount <= remaining, EFillExceedsRemaining);

    // Reconstruct original sell amount: remaining balance + already filled
    let original_sell_amount = remaining + intent.filled_amount;

    // proportional_min_out = min_amount_out * fill_amount / original_sell_amount
    let proportional_min_out =
        (intent.min_amount_out as u128) * (fill_amount as u128)
        / (original_sell_amount as u128);

    let partial_balance = intent.sell_balance.split(fill_amount);
    intent.filled_amount = intent.filled_amount + fill_amount;

    (intent.owner, partial_balance, (proportional_min_out as u64))
}

// === Getters ===

/// Get intent owner.
public fun owner<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): address {
    intent.owner
}

/// Get sell amount (derived from locked balance).
public fun sell_amount<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.sell_balance.value()
}

/// Get minimum output required (in BuyCoin).
public fun min_amount_out<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.min_amount_out
}

/// Get deadline in milliseconds.
public fun deadline<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.deadline
}

/// Get batch ID if assigned.
public fun batch_id<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): Option<u64> {
    intent.batch_id
}

/// Whether the intent allows partial fills.
public fun partial_fillable<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): bool {
    intent.partial_fillable
}

/// Amount already filled (in SellCoin units).
public fun filled_amount<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.filled_amount
}

// === Test Helpers ===

#[test_only]
public fun set_batch_id_for_testing<SellCoin, BuyCoin>(
    intent: &mut Intent<SellCoin, BuyCoin>,
    batch_id: u64,
) {
    intent.batch_id = option::some(batch_id);
}

#[test_only]
public fun create_intent_for_testing<SellCoin, BuyCoin>(
    sell_amount: u64,
    min_amount_out: u64,
    partial_fillable: bool,
    deadline: u64,
    batch_id: u64,
    ctx: &mut TxContext,
): Intent<SellCoin, BuyCoin> {
    Intent<SellCoin, BuyCoin> {
        id: object::new(ctx),
        batch_id: option::some(batch_id),
        owner: ctx.sender(),
        sell_balance: balance::create_for_testing<SellCoin>(sell_amount),
        min_amount_out,
        partial_fillable,
        filled_amount: 0,
        deadline,
    }
}

#[test_only]
public fun intent_id<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): ID {
    intent.id.to_inner()
}
