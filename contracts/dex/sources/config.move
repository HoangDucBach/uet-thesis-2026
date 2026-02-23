module cow_dex::config;

use sui::table::{Self, Table};

// === Constants ===

const INITIAL_VERSION: u64 = 1;
const MAX_PROTOCOL_FEE_BPS: u64 = 10_000;

// === Default Configuration Parameters ===

const DEFAULT_MIN_BOND: u64 = 1_000_000_000; // 1 SUI
const DEFAULT_COMMIT_DURATION_MS: u64 = 2000; // 2 seconds
const DEFAULT_GRACE_PERIOD_MS: u64 = 5000; // 5 seconds
const DEFAULT_PROTOCOL_FEE_BPS: u64 = 100; // 1% (100 bps)

// === ACL Roles ===

const ROLE_CONFIG_ADMIN: u64 = 0;

// === Errors ===

const EUnauthorized: u64 = 0;
const EInvalidFeeRate: u64 = 1;
const EInvalidBondAmount: u64 = 2;
const EInvalidDuration: u64 = 3;

// === Structs ===

/// Administrative capability for configuration management.
public struct AdminCap has key, store {
    id: UID,
}

/// Access control list managing protocol roles.
/// * `members`: Table mapping address → vector of roles.
public struct ACL has store {
    members: Table<address, vector<u64>>,
}

/// Global protocol configuration.
/// * `id`: Unique identifier.
/// * `min_bond`: Minimum SUI bond required from solvers.
/// * `commit_duration_ms`: Duration of commit phase.
/// * `grace_period_ms`: Grace period for winner execution.
/// * `protocol_fee_bps`: Protocol fee in basis points.
/// * `acl`: Access control list.
/// * `version`: Protocol version for upgrade tracking.
public struct GlobalConfig has key, store {
    id: UID,
    min_bond: u64,
    commit_duration_ms: u64,
    grace_period_ms: u64,
    protocol_fee_bps: u64,
    acl: ACL,
    version: u64,
}

// === Events ===

/// Emitted when minimum bond is updated.
public struct UpdateMinBondEvent has copy, drop {
    old_value: u64,
    new_value: u64,
}

/// Emitted when commit duration is updated.
public struct UpdateCommitDurationEvent has copy, drop {
    old_value: u64,
    new_value: u64,
}

/// Emitted when grace period is updated.
public struct UpdateGracePeriodEvent has copy, drop {
    old_value: u64,
    new_value: u64,
}

/// Emitted when protocol fee is updated.
public struct UpdateProtocolFeeEvent has copy, drop {
    old_value: u64,
    new_value: u64,
}

/// Emitted when role is granted to an address.
public struct RoleGrantedEvent has copy, drop {
    address: address,
    role: u64,
}

/// Emitted when role is revoked from an address.
public struct RoleRevokedEvent has copy, drop {
    address: address,
    role: u64,
}

// === Initialization ===

/// Initialize the global configuration and admin capability.
/// Called once during protocol setup.
/// * `ctx`: Transaction context.
public fun init_config(ctx: &mut TxContext): (GlobalConfig, AdminCap) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    let config = GlobalConfig {
        id: object::new(ctx),
        min_bond: DEFAULT_MIN_BOND,
        commit_duration_ms: DEFAULT_COMMIT_DURATION_MS,
        grace_period_ms: DEFAULT_GRACE_PERIOD_MS,
        protocol_fee_bps: DEFAULT_PROTOCOL_FEE_BPS,
        acl: ACL { members: table::new(ctx) },
        version: INITIAL_VERSION,
    };

    (config, admin_cap)
}

/// Update minimum bond amount.
/// * `config`: The GlobalConfig.
/// * `new_min_bond`: New minimum bond in base units.
/// * `_cap`: AdminCap for authorization.
public fun set_min_bond(config: &mut GlobalConfig, new_min_bond: u64, _cap: &AdminCap) {
    assert!(new_min_bond > 0, EInvalidBondAmount);

    let old_value = config.min_bond;
    config.min_bond = new_min_bond;

    sui::event::emit(UpdateMinBondEvent {
        old_value,
        new_value: new_min_bond,
    });
}

/// Update commit phase duration.
/// * `config`: The GlobalConfig.
/// * `new_commit_duration_ms`: New duration in milliseconds.
/// * `_cap`: AdminCap for authorization.
public fun set_commit_duration(
    config: &mut GlobalConfig,
    new_commit_duration_ms: u64,
    _cap: &AdminCap,
) {
    assert!(new_commit_duration_ms > 0, EInvalidDuration);

    let old_value = config.commit_duration_ms;
    config.commit_duration_ms = new_commit_duration_ms;

    sui::event::emit(UpdateCommitDurationEvent {
        old_value,
        new_value: new_commit_duration_ms,
    });
}

/// Update grace period for winner execution.
/// * `config`: The GlobalConfig.
/// * `new_grace_period_ms`: New grace period in milliseconds.
/// * `_cap`: AdminCap for authorization.
public fun set_grace_period(config: &mut GlobalConfig, new_grace_period_ms: u64, _cap: &AdminCap) {
    assert!(new_grace_period_ms > 0, EInvalidDuration);

    let old_value = config.grace_period_ms;
    config.grace_period_ms = new_grace_period_ms;

    sui::event::emit(UpdateGracePeriodEvent {
        old_value,
        new_value: new_grace_period_ms,
    });
}

/// Update protocol fee rate.
/// * `config`: The GlobalConfig.
/// * `new_protocol_fee_bps`: New fee in basis points (0-10000).
/// * `_cap`: AdminCap for authorization.
public fun set_protocol_fee(config: &mut GlobalConfig, new_protocol_fee_bps: u64, _cap: &AdminCap) {
    assert!(new_protocol_fee_bps <= MAX_PROTOCOL_FEE_BPS, EInvalidFeeRate);

    let old_value = config.protocol_fee_bps;
    config.protocol_fee_bps = new_protocol_fee_bps;

    sui::event::emit(UpdateProtocolFeeEvent {
        old_value,
        new_value: new_protocol_fee_bps,
    });
}

/// Grant a role to an address.
/// * `config`: The GlobalConfig.
/// * `address`: Address to grant role to.
/// * `role`: Role ID to grant (must be ROLE_CONFIG_ADMIN).
/// * `_cap`: AdminCap for authorization.
public fun grant_role(config: &mut GlobalConfig, address: address, role: u64, _cap: &AdminCap) {
    assert!(role == ROLE_CONFIG_ADMIN, EUnauthorized);

    let acl = &mut config.acl;
    if (!table::contains(&acl.members, address)) {
        table::add(&mut acl.members, address, vector::empty());
    };

    let roles = table::borrow_mut(&mut acl.members, address);
    if (!vector::contains(roles, &role)) {
        vector::push_back(roles, role);
    };

    sui::event::emit(RoleGrantedEvent { address, role });
}

/// Revoke a role from an address.
/// * `config`: The GlobalConfig.
/// * `address`: Address to revoke role from.
/// * `role`: Role ID to revoke (must be ROLE_CONFIG_ADMIN).
/// * `_cap`: AdminCap for authorization.
public fun revoke_role(config: &mut GlobalConfig, address: address, role: u64, _cap: &AdminCap) {
    assert!(role == ROLE_CONFIG_ADMIN, EUnauthorized);

    let acl = &mut config.acl;
    if (!table::contains(&acl.members, address)) {
        return
    };

    let roles = table::borrow_mut(&mut acl.members, address);
    let mut idx = 0;
    let len = vector::length(roles);
    let mut found_idx = len;

    while (idx < len) {
        if (*vector::borrow(roles, idx) == role) {
            found_idx = idx;
            break
        };
        idx = idx + 1;
    };

    if (found_idx < len) {
        vector::remove(roles, found_idx);
    };

    sui::event::emit(RoleRevokedEvent { address, role });
}

// === Permission Checks ===

/// Check if address has a specific role.
/// * `config`: The GlobalConfig.
/// * `address`: Address to check.
/// * `role`: Role ID to check.
public fun has_role(config: &GlobalConfig, address: address, role: u64): bool {
    let acl = &config.acl;
    if (!table::contains(&acl.members, address)) {
        return false
    };
    let roles = table::borrow(&acl.members, address);
    vector::contains(roles, &role)
}

/// Assert that address has ROLE_CONFIG_ADMIN.
/// * `config`: The GlobalConfig.
/// * `address`: Address to check.
public fun assert_config_admin(config: &GlobalConfig, address: address) {
    assert!(has_role(config, address, ROLE_CONFIG_ADMIN), EUnauthorized);
}

// === Getters ===

/// Get minimum bond amount.
public fun min_bond(config: &GlobalConfig): u64 {
    config.min_bond
}

/// Get commit phase duration.
public fun commit_duration_ms(config: &GlobalConfig): u64 {
    config.commit_duration_ms
}

/// Get grace period for execution.
public fun grace_period_ms(config: &GlobalConfig): u64 {
    config.grace_period_ms
}

/// Get protocol fee in basis points.
public fun protocol_fee_bps(config: &GlobalConfig): u64 {
    config.protocol_fee_bps
}

/// Get current version.
public fun version(config: &GlobalConfig): u64 {
    config.version
}

/// Get ROLE_CONFIG_ADMIN constant.
public fun role_config_admin(): u64 {
    ROLE_CONFIG_ADMIN
}

// === Test Helpers ===

#[test_only]
public fun default_min_bond(): u64 { DEFAULT_MIN_BOND }

#[test_only]
public fun default_commit_duration_ms(): u64 { DEFAULT_COMMIT_DURATION_MS }

#[test_only]
public fun default_grace_period_ms(): u64 { DEFAULT_GRACE_PERIOD_MS }

#[test_only]
public fun default_protocol_fee_bps(): u64 { DEFAULT_PROTOCOL_FEE_BPS }

#[test_only]
public fun max_protocol_fee_bps(): u64 { MAX_PROTOCOL_FEE_BPS }

#[test_only]
public fun destroy_for_testing(config: GlobalConfig, cap: AdminCap) {
    std::unit_test::destroy(config);
    std::unit_test::destroy(cap);
}
