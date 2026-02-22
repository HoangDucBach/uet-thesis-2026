module cow_dex::config;

use sui::table::{Self, Table};

// === Constants ===

const INITIAL_VERSION: u64 = 1;
const MAX_PROTOCOL_FEE_BPS: u64 = 10_000; // 100% in basis points

// === ACL Roles ===

/// Role: Can modify core protocol parameters (bonds, durations)
const ROLE_CONFIG_ADMIN: u64 = 0;

/// Role: Can manage settlement auction parameters
const ROLE_SETTLEMENT_MANAGER: u64 = 1;

/// Role: Can claim protocol fees
const ROLE_FEE_CLAIMER: u64 = 2;

/// Role: Can pause/unpause the protocol
const ROLE_EMERGENCY_PAUSE: u64 = 3;

// === Errors ===

const EUnauthorized: u64 = 0;
const EInvalidFeeRate: u64 = 1;
const EInvalidBondAmount: u64 = 2;
const EInvalidDuration: u64 = 3;
const EProtocolPaused: u64 = 4;
const EInvalidVersion: u64 = 5;

// === Structs ===

/// Administrative capability for configuration management.
/// Only holder can modify protocol parameters.
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
/// * `min_bond`: Minimum SUI bond required from solvers (in basis).
/// * `commit_duration_ms`: Duration of commit phase (milliseconds).
/// * `grace_period_ms`: Grace period for winner execution (milliseconds).
/// * `protocol_fee_bps`: Protocol fee in basis points (0-10000).
/// * `is_paused`: Whether the protocol is paused.
/// * `acl`: Access control list.
/// * `version`: Protocol version for upgrade tracking.
public struct GlobalConfig has key, store {
    id: UID,
    min_bond: u64,
    commit_duration_ms: u64,
    grace_period_ms: u64,
    protocol_fee_bps: u64,
    is_paused: bool,
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

/// Emitted when protocol is paused or resumed.
public struct ProtocolPausedEvent has copy, drop {
    is_paused: bool,
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
        min_bond: 1_000_000_000,        // 1 SUI
        commit_duration_ms: 2000,       // 2 seconds
        grace_period_ms: 5000,          // 5 seconds
        protocol_fee_bps: 100,          // 1% (100 bps)
        is_paused: false,
        acl: ACL { members: table::new(ctx) },
        version: INITIAL_VERSION,
    };

    (config, admin_cap)
}

// === Configuration Setters ===

/// Update minimum bond amount.
/// * `config`: The GlobalConfig.
/// * `new_min_bond`: New minimum bond in base units.
/// * `_cap`: AdminCap for authorization.
public fun set_min_bond(
    config: &mut GlobalConfig,
    new_min_bond: u64,
    _cap: &AdminCap,
) {
    assert!(!config.is_paused, EProtocolPaused);
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
    assert!(!config.is_paused, EProtocolPaused);
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
public fun set_grace_period(
    config: &mut GlobalConfig,
    new_grace_period_ms: u64,
    _cap: &AdminCap,
) {
    assert!(!config.is_paused, EProtocolPaused);
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
public fun set_protocol_fee(
    config: &mut GlobalConfig,
    new_protocol_fee_bps: u64,
    _cap: &AdminCap,
) {
    assert!(!config.is_paused, EProtocolPaused);
    assert!(new_protocol_fee_bps <= MAX_PROTOCOL_FEE_BPS, EInvalidFeeRate);

    let old_value = config.protocol_fee_bps;
    config.protocol_fee_bps = new_protocol_fee_bps;

    sui::event::emit(UpdateProtocolFeeEvent {
        old_value,
        new_value: new_protocol_fee_bps,
    });
}

/// Pause the protocol (emergency stop).
/// * `config`: The GlobalConfig.
/// * `_cap`: AdminCap for authorization.
public fun pause_protocol(config: &mut GlobalConfig, _cap: &AdminCap) {
    config.is_paused = true;
    sui::event::emit(ProtocolPausedEvent { is_paused: true });
}

/// Resume the protocol.
/// * `config`: The GlobalConfig.
/// * `_cap`: AdminCap for authorization.
public fun resume_protocol(config: &mut GlobalConfig, _cap: &AdminCap) {
    config.is_paused = false;
    sui::event::emit(ProtocolPausedEvent { is_paused: false });
}

// === ACL Management ===

/// Grant a role to an address.
/// * `config`: The GlobalConfig.
/// * `address`: Address to grant role to.
/// * `role`: Role ID to grant.
/// * `_cap`: AdminCap for authorization.
public fun grant_role(
    config: &mut GlobalConfig,
    address: address,
    role: u64,
    _cap: &AdminCap,
) {
    assert!(role <= 3, EInvalidVersion);

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
/// * `role`: Role ID to revoke.
/// * `_cap`: AdminCap for authorization.
public fun revoke_role(
    config: &mut GlobalConfig,
    address: address,
    role: u64,
    _cap: &AdminCap,
) {
    assert!(role <= 3, EInvalidVersion);

    let acl = &mut config.acl;
    if (!table::contains(&acl.members, address)) {
        return
    };

    let roles = table::borrow_mut(&mut acl.members, address);
    let idx = 0;
    let len = vector::length(roles);
    let mut found_idx = len;

    while (idx < len) {
        if (*vector::borrow(roles, idx) == role) {
            found_idx = idx;
            break
        };
        idx + 1;
    };

    if (found_idx < len) {
        vector::remove(roles, found_idx);
    };

    sui::event::emit(RoleRevokedEvent { address, role });
}

// === Permission Checks ===

/// Check if protocol is paused.
/// * `config`: The GlobalConfig.
public fun assert_not_paused(config: &GlobalConfig) {
    assert!(!config.is_paused, EProtocolPaused);
}

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

/// Assert that address has ROLE_SETTLEMENT_MANAGER.
/// * `config`: The GlobalConfig.
/// * `address`: Address to check.
public fun assert_settlement_manager(config: &GlobalConfig, address: address) {
    assert!(has_role(config, address, ROLE_SETTLEMENT_MANAGER), EUnauthorized);
}

/// Assert that address has ROLE_FEE_CLAIMER.
/// * `config`: The GlobalConfig.
/// * `address`: Address to check.
public fun assert_fee_claimer(config: &GlobalConfig, address: address) {
    assert!(has_role(config, address, ROLE_FEE_CLAIMER), EUnauthorized);
}

/// Assert that address has ROLE_EMERGENCY_PAUSE.
/// * `config`: The GlobalConfig.
/// * `address`: Address to check.
public fun assert_emergency_pause(config: &GlobalConfig, address: address) {
    assert!(has_role(config, address, ROLE_EMERGENCY_PAUSE), EUnauthorized);
}

// === Getters ===

/// Get minimum bond amount.
public fun get_min_bond(config: &GlobalConfig): u64 {
    config.min_bond
}

/// Get commit phase duration.
public fun get_commit_duration_ms(config: &GlobalConfig): u64 {
    config.commit_duration_ms
}

/// Get grace period for execution.
public fun get_grace_period_ms(config: &GlobalConfig): u64 {
    config.grace_period_ms
}

/// Get protocol fee in basis points.
public fun get_protocol_fee_bps(config: &GlobalConfig): u64 {
    config.protocol_fee_bps
}

/// Check if protocol is paused.
public fun is_paused(config: &GlobalConfig): bool {
    config.is_paused
}

/// Get current version.
public fun get_version(config: &GlobalConfig): u64 {
    config.version
}

// === Role Constants (for external use) ===

/// Get ROLE_CONFIG_ADMIN constant.
public fun role_config_admin(): u64 {
    ROLE_CONFIG_ADMIN
}

/// Get ROLE_SETTLEMENT_MANAGER constant.
public fun role_settlement_manager(): u64 {
    ROLE_SETTLEMENT_MANAGER
}

/// Get ROLE_FEE_CLAIMER constant.
public fun role_fee_claimer(): u64 {
    ROLE_FEE_CLAIMER
}

/// Get ROLE_EMERGENCY_PAUSE constant.
public fun role_emergency_pause(): u64 {
    ROLE_EMERGENCY_PAUSE
}
