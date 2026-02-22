module cow_dex::intent_book;

use std::type_name;
use sui::bcs;
use sui::clock::Clock;
use sui::ed25519;
use sui::table::{Self, Table};

// === Constants ===
const INITIAL_VERSION: u64 = 0;

// === Errors ===
const EInvalidSignature: u64 = 0;
const EExpiredDeadline: u64 = 1;
const EInvalidNonce: u64 = 2;

// === Enums ===
public enum IntentStatus has copy, drop, store {
    Pending,
    Filled,
    Cancelled,
}

// === Structs ===

/// Light Registry — stores only nonces for replay prevention.
/// Intent data remains OFF-CHAIN in Relay until settlement.
///
/// * `id`: Unique identifier of the registry.
/// * `user_nonces`: Table<address, u64> mapping user → next expected nonce.
/// * `version`: Incremented on critical parameter changes.
public struct IntentRegistry has key, store {
    id: UID,
    user_nonces: Table<address, u64>,
    version: u64,
}

// === Functions ===

/// Initialize a new IntentRegistry. Typically called once during protocol setup.
/// * `ctx`: Transaction context.
public fun new(ctx: &mut TxContext): IntentRegistry {
    IntentRegistry {
        id: object::new(ctx),
        user_nonces: table::new(ctx),
        version: INITIAL_VERSION,
    }
}

/// Verify and consume an intent during settlement.
/// Called by Solver inside the settlement PTB for each intent.
///
/// Validates:
/// - Nonce matches next expected (replay prevention)
/// - Deadline has not passed
/// - ed25519 signature is valid over the intent message
///
/// On success, increments the user's nonce atomically.
/// If ANY intent verification fails, the entire PTB reverts.
///
/// * `registry`: The IntentRegistry.
/// * `user`: Address of the intent creator.
/// * `sell_amount`: Amount of sell token.
/// * `min_amount_out`: Minimum acceptable buy amount.
/// * `deadline`: Unix milliseconds deadline.
/// * `nonce`: User's current nonce.
/// * `signature`: Ed25519 signature (64 bytes).
/// * `pubkey`: User's public key for verification (32 bytes for Ed25519).
/// * `clock`: Sui clock for deadline validation.
public fun verify_and_consume_intent<SellCoin, BuyCoin>(
    registry: &mut IntentRegistry,
    user: address,
    sell_amount: u64,
    min_amount_out: u64,
    deadline: u64,
    nonce: u64,
    signature: vector<u8>,
    pubkey: vector<u8>,
    clock: &Clock,
) {
    // 1. Verify nonce is correct (monotonic, replay protection)
    let current_nonce = if (table::contains(&registry.user_nonces, user)) {
        *table::borrow(&registry.user_nonces, user)
    } else {
        0
    };

    assert!(nonce == current_nonce, EInvalidNonce);

    // 2. Verify deadline has not passed
    let current_time_ms = clock.timestamp_ms();
    assert!(current_time_ms <= deadline, EExpiredDeadline);

    // 3. Verify ed25519 signature over the intent message
    let intent_hash = encode_intent_hash<SellCoin, BuyCoin>(
        user,
        sell_amount,
        min_amount_out,
        deadline,
        nonce,
    );
    assert!(ed25519::ed25519_verify(&signature, &pubkey, &intent_hash), EInvalidSignature);

    // 4. Atomically consume (burn) the nonce
    // After this, the same (user, nonce) pair can never be verified again
    if (table::contains(&registry.user_nonces, user)) {
        *table::borrow_mut(&mut registry.user_nonces, user) = current_nonce + 1;
    } else {
        table::add(&mut registry.user_nonces, user, 1);
    };
}

// === Getters ===

/// Get the current user nonce (for next intent submission).
/// * `registry`: The IntentRegistry.
/// * `user`: The user address.
public fun user_nonce(registry: &IntentRegistry, user: address): u64 {
    if (table::contains(&registry.user_nonces, user)) {
        *table::borrow(&registry.user_nonces, user)
    } else {
        0
    }
}

/// Get current version.
/// * `registry`: The IntentRegistry.
public fun version(registry: &IntentRegistry): u64 {
    registry.version
}

// === Helper Functions ===

/// Encode intent data into bytes for ed25519 signature verification.
/// Must match the exact encoding used by the SDK when signing.
///
/// Encoding order (BCS):
/// user (address) | SellCoin type | BuyCoin type |
/// sell_amount (u64) | min_amount_out (u64) | deadline (u64) | nonce (u64)
///
/// * `user`: User address.
/// * `sell_amount`: Amount to sell.
/// * `min_amount_out`: Minimum acceptable buy amount.
/// * `deadline`: Deadline in milliseconds.
/// * `nonce`: Monotonic nonce.
fun encode_intent_hash<SellCoin, BuyCoin>(
    user: address,
    sell_amount: u64,
    min_amount_out: u64,
    deadline: u64,
    nonce: u64,
): vector<u8> {
    let mut buf = bcs::to_bytes(&user);

    // Include coin types in the hash to bind signature to specific token pair
    let sell_type = type_name::with_defining_ids<SellCoin>();
    let buy_type = type_name::with_defining_ids<BuyCoin>();

    buf.append(bcs::to_bytes(&sell_type));
    buf.append(bcs::to_bytes(&buy_type));
    buf.append(bcs::to_bytes(&sell_amount));
    buf.append(bcs::to_bytes(&min_amount_out));
    buf.append(bcs::to_bytes(&deadline));
    buf.append(bcs::to_bytes(&nonce));

    buf
}
