module cow_dex::intent_book;

use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event::emit;

// === Errors ===
const EDeadlineInPast: u64 = 0;
const ENotIntentOwner: u64 = 1;

// === Events ===

/// Emitted when user creates a new intent.
public struct IntentCreatedEvent has copy, drop {
    intent_id: ID,
    owner: address,
    sell_amount: u64,
    min_amount_out: u64,
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
/// * `sell_balance`: Locked coins of type SellCoin.
/// * `sell_amount`: Amount to sell.
/// * `min_amount_out`: User's minimum acceptable output.
/// * `deadline`: Unix milliseconds — intent expires after this.
public struct Intent<phantom SellCoin, phantom BuyCoin> has key {
    id: UID,
    batch_id: Option<u64>,
    owner: address,
    sell_balance: Balance<SellCoin>,
    sell_amount: u64,
    min_amount_out: u64,
    deadline: u64,
}

/// Owned capability — user holds this to prove ownership and cancel intent.
///
/// * `id`: Capability ID.
/// * `intent_id`: ID of the Intent this cap controls.
public struct IntentCap has key, store {
    id: UID,
    intent_id: ID,
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
    deadline: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): IntentCap {
    let current_time_ms = clock.timestamp_ms();
    assert!(deadline > current_time_ms, EDeadlineInPast);

    let sell_amount = coin::value(&coin);
    let owner = ctx.sender();
    let sell_balance = coin::into_balance(coin);

    let intent = Intent<SellCoin, BuyCoin> {
        id: object::new(ctx),
        batch_id: std::option::none(),
        owner,
        sell_balance,
        sell_amount,
        min_amount_out,
        deadline,
    };

    let intent_id = object::id(&intent);
    let cap = IntentCap {
        id: object::new(ctx),
        intent_id,
    };

    // Share the intent object
    transfer::share_object(intent);

    emit(IntentCreatedEvent {
        intent_id,
        owner,
        sell_amount,
        min_amount_out,
        deadline,
    });

    cap
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
    cap: IntentCap,
    intent: Intent<SellCoin, BuyCoin>,
    ctx: &mut TxContext,
) {
    let IntentCap { id: cap_id, intent_id } = cap;
    let Intent<SellCoin, BuyCoin> { id, owner, sell_balance, sell_amount, .. } = intent;

    object::delete(cap_id);
    object::delete(id);

    assert!(owner == ctx.sender(), ENotIntentOwner);

    // Return coins to user
    transfer::public_transfer(
        coin::from_balance(sell_balance, ctx),
        owner,
    );

    emit(IntentCancelledEvent {
        intent_id,
        owner,
        sell_amount,
    });
}

/// Consume intent during settlement.
/// Intent taken by value and deleted — prevents replay.
/// Sui linear type system guarantees deletion is irreversible.
///
/// * `intent`: Intent taken by value (deleted atomically).
/// Returns: (owner address, sell_balance, min_amount_out)
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

// === Getters ===

/// Get intent owner.
public fun owner<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): address {
    intent.owner
}

/// Get sell amount.
public fun sell_amount<SellCoin, BuyCoin>(intent: &Intent<SellCoin, BuyCoin>): u64 {
    intent.sell_amount
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
