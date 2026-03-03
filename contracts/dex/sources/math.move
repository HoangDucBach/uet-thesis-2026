module cow_dex::math;

// === Constants ===

/// Scaling factor for fixed-point arithmetic (10^9).
const FLOAT_SCALING: u128 = 1_000_000_000;

/// Maximum value representable as u64 (2^64 − 1), stored as u128.
/// Used to guard against overflow before casting u128 → u64.
const MAX_U64: u128 = (1u128 << 64) - 1;

// === Getters ===

/// Return the float scaling factor (10^9).
public fun float_scaling(): u128 {
    FLOAT_SCALING
}

/// Return the maximum u64 value as u128.
/// Use this to guard `(x as u64)` casts:
///   assert!(x <= math::max_u64(), EOverflow);
public fun max_u64(): u128 {
    MAX_U64
}

// === Arithmetic helpers ===

/// Return the larger of two u64 values.
public fun max_u64_val(a: u64, b: u64): u64 {
    if (a > b) a else b
}

/// Return the smaller of two u64 values.
public fun min_u64_val(a: u64, b: u64): u64 {
    if (a < b) a else b
}

/// Scale `amount` by `numerator / denominator`, operating entirely in u128
/// to avoid overflow.  Aborts on division-by-zero.
public fun muldiv(amount: u64, numerator: u64, denominator: u64): u64 {
    let result = (amount as u128) * (numerator as u128) / (denominator as u128);
    assert!(result <= MAX_U64, 0);
    (result as u64)
}
