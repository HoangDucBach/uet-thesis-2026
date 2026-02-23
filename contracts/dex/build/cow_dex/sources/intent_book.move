module cow_dex::intent_book;

use std::type_name::{Self, TypeName};
use sui::clock::Clock;
use sui::coin::{Self, Coin};

// === Errors ===
const EDeadlineInPast: u64 = 0;
const ENotIntentOwner: u64 = 1;

// === Events ===

/// Emitted when user creates a new intent.
public struct IntentCreatedEvent has copy, drop {
    intent_id: ID,
    owner: address,
    sell_type: TypeName,
    sell_amount: u64,
    buy_type: TypeName,
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
/// [v2.3] Replaces IntentRegistry + off-chain relay model.
/// Replay protection: Intent deleted via object::delete(id) in consume_intent()
/// → Sui linear type system prevents double settlement.
///
/// * `id`: Shared object ID.
/// * `batch_id`: Optional — set when assigned to a batch.
/// * `owner`: User address (creator).
/// * `sell_balance`: Locked coins (user's asset during settlement period).
/// * `sell_amount`: Amount to sell (for CoW matching).
/// * `buy_type`: Token type expected in return.
/// * `min_amount_out`: User's minimum acceptable output.
/// * `deadline`: Unix milliseconds — intent expires after this.
public struct Intent<phantom T> has key {
    id: UID,
    batch_id: Option<u64>,
    owner: address,
    sell_balance: sui::balance::Balance<T>,
    sell_amount: u64,
    buy_type: TypeName,
    min_amount_out: u64,
    deadline: u64,
}

/// Owned capability — user holds this to prove ownership and cancel intent.
/// Consumed when user calls cancel_intent() or when solver consumes the intent.
///
/// * `id`: Capability ID.
/// * `intent_id`: ID of the Intent this cap controls.
public struct IntentCap has key, store {
    id: UID,
    intent_id: ID,
}

// === Functions ===

/// User creates a new intent, locking coins in a shared object.
/// [v2.3] On-chain intake: coin locked immediately.
/// Solver discovers via IntentCreatedEvent.
/// Replay protection: Sui object deletion (Intent deleted in consume_intent).
///
/// * `coin`: User's coin to trade.
/// * `min_amount_out`: Minimum acceptable output.
/// * `buy_type`: Type name of output token.
/// * `deadline`: Unix milliseconds deadline.
/// * `clock`: Sui clock for deadline validation.
/// * `ctx`: Transaction context.
public fun create_intent<T>(
    coin: Coin<T>,
    min_amount_out: u64,
    buy_type: TypeName,
    deadline: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): IntentCap {
    let current_time_ms = clock.timestamp_ms();
    assert!(deadline > current_time_ms, EDeadlineInPast);

    let sell_amount = coin::value(&coin);
    let owner = ctx.sender();
    let sell_balance = coin::into_balance(coin);

    let intent = Intent<T> {
        id: object::new(ctx),
        batch_id: std::option::none(),
        owner,
        sell_balance,
        sell_amount,
        buy_type,
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

    sui::event::emit(IntentCreatedEvent {
        intent_id,
        owner,
        sell_type: type_name::with_defining_ids<T>(),
        sell_amount,
        buy_type,
        min_amount_out,
        deadline,
    });

    cap
}

/// User cancels their intent, retrieving coins.
/// [v2.3] Can be called anytime before settlement.
/// Consumes both cap and intent (both taken by value).
///
/// * `cap`: IntentCap (owned, user holds).
/// * `intent`: Intent object (shared, deleted here).
/// * `ctx`: Transaction context.
public fun cancel_intent<T>(
    cap: IntentCap,
    intent: Intent<T>,
    ctx: &mut TxContext,
) {
    let IntentCap { id: cap_id, intent_id } = cap;
    let Intent<T> { id, owner, sell_balance, sell_amount, .. } = intent;

    object::delete(cap_id);
    object::delete(id);

    assert!(owner == ctx.sender(), ENotIntentOwner);

    // Return coins to user
    transfer::public_transfer(
        coin::from_balance(sell_balance, ctx),
        owner,
    );

    sui::event::emit(IntentCancelledEvent {
        intent_id,
        owner,
        sell_amount,
    });
}

/// Consume intent during settlement (called by settlement.move only).
/// [v2.3] Called from SettlementTicket pattern via process_intent().
/// Intent taken by value and deleted — prevents replay.
/// Sui linear type system guarantees deletion is irreversible.
///
/// * `intent`: Intent taken by value (deleted atomically).
/// Returns: (owner address, sell_balance, min_amount_out)
public(package) fun consume_intent<T>(
    intent: Intent<T>,
): (address, sui::balance::Balance<T>, u64) {
    let Intent<T> {
        id,
        owner,
        sell_balance,
        min_amount_out,
        ..
    } = intent;

    object::delete(id);  // ← shared object deleted — replay impossible
    (owner, sell_balance, min_amount_out)
}

// === Getters ===

/// Get intent owner.
public fun owner<T>(intent: &Intent<T>): address {
    intent.owner
}

/// Get sell amount.
public fun sell_amount<T>(intent: &Intent<T>): u64 {
    intent.sell_amount
}

/// Get minimum output required.
public fun min_amount_out<T>(intent: &Intent<T>): u64 {
    intent.min_amount_out
}

/// Get deadline in milliseconds.
public fun deadline<T>(intent: &Intent<T>): u64 {
    intent.deadline
}

/// Get buy token type.
public fun buy_type<T>(intent: &Intent<T>): TypeName {
    intent.buy_type
}

/// Get batch ID if assigned.
public fun batch_id<T>(intent: &Intent<T>): Option<u64> {
    intent.batch_id
}
