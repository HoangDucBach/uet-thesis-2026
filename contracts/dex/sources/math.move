module cow_dex::math;

use std::u64;

// === Constants ===

/// Scaling factor for fixed-point arithmetic (10^9).
const FLOAT_SCALING: u128 = 1_000_000_000;

// === Getters ===

/// Return the float scaling factor (10^9).
public fun float_scaling(): u128 {
    FLOAT_SCALING
}

/// Return the maximum u64 value as u128.
/// Use this to guard `(x as u64)` casts:
///   assert!(x <= math::max_u64(), EOverflow);
public fun max_u64(): u128 {
    u64::max_value!() as u128
}
