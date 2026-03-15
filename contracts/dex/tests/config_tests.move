module cow_dex::config_tests;

use cow_dex::config;

// === Constants ===

const EINVALID_FEE_RATE: u64 = 1;
const EINVALID_BOND_AMOUNT: u64 = 2;
const EINVALID_DURATION: u64 = 3;
const EUNAUTHORIZED: u64 = 0;

// === Tests: Initialization ===

#[test]
fun test_init_config_defaults() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);

    assert!(config.min_bond() == config::default_min_bond());
    assert!(config.commit_duration_ms() == config::default_commit_duration_ms());
    assert!(config.grace_period_ms() == config::default_grace_period_ms());
    assert!(config.protocol_fee_bps() == config::default_protocol_fee_bps());
    assert!(config.version() == 1);

    config.destroy_for_testing(cap);
}

// === Tests: set_min_bond ===

#[test]
fun test_set_min_bond() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_min_bond(2_000_000_000, &cap);
    assert!(config.min_bond() == 2_000_000_000);

    config.destroy_for_testing(cap);
}

#[test]
#[expected_failure(abort_code = EINVALID_BOND_AMOUNT, location = cow_dex::config)]
fun test_set_min_bond_zero_aborts() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_min_bond(0, &cap);

    config.destroy_for_testing(cap);
}

// === Tests: set_commit_duration ===

#[test]
fun test_set_commit_duration() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_commit_duration(3000, &cap);
    assert!(config.commit_duration_ms() == 3000);

    config.destroy_for_testing(cap);
}

#[test]
#[expected_failure(abort_code = EINVALID_DURATION, location = cow_dex::config)]
fun test_set_commit_duration_zero_aborts() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_commit_duration(0, &cap);

    config.destroy_for_testing(cap);
}

// === Tests: set_grace_period ===

#[test]
#[expected_failure(abort_code = EINVALID_DURATION, location = cow_dex::config)]
fun test_set_grace_period_zero_aborts() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_grace_period(0, &cap);

    config.destroy_for_testing(cap);
}

// === Tests: set_protocol_fee ===

#[test]
fun test_set_protocol_fee_zero_allowed() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_protocol_fee(0, &cap);
    assert!(config.protocol_fee_bps() == 0);

    config.destroy_for_testing(cap);
}

#[test]
fun test_set_protocol_fee_max_boundary() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_protocol_fee(config::max_protocol_fee_bps(), &cap);
    assert!(config.protocol_fee_bps() == 10_000);

    config.destroy_for_testing(cap);
}

#[test]
#[expected_failure(abort_code = EINVALID_FEE_RATE, location = cow_dex::config)]
fun test_set_protocol_fee_exceeds_max_aborts() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.set_protocol_fee(10_001, &cap);

    config.destroy_for_testing(cap);
}

// === Tests: ACL grant/revoke ===

#[test]
fun test_grant_role_and_check() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);
    let addr = @0xCAFE;

    assert!(!config.has_role(addr, config::role_config_admin()));

    config.grant_role(addr, config::role_config_admin(), &cap);

    assert!(config.has_role(addr, config::role_config_admin()));

    config.destroy_for_testing(cap);
}

#[test]
fun test_grant_role_idempotent() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);
    let addr = @0xCAFE;

    config.grant_role(addr, config::role_config_admin(), &cap);
    config.grant_role(addr, config::role_config_admin(), &cap);

    assert!(config.has_role(addr, config::role_config_admin()));

    config.destroy_for_testing(cap);
}

#[test]
fun test_revoke_role() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);
    let addr = @0xCAFE;

    config.grant_role(addr, config::role_config_admin(), &cap);
    assert!(config.has_role(addr, config::role_config_admin()));

    config.revoke_role(addr, config::role_config_admin(), &cap);
    assert!(!config.has_role(addr, config::role_config_admin()));

    config.destroy_for_testing(cap);
}

#[test]
fun test_revoke_role_not_in_acl_is_noop() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.revoke_role(@0xDEAD, config::role_config_admin(), &cap);

    config.destroy_for_testing(cap);
}

#[test]
#[expected_failure(abort_code = EUNAUTHORIZED, location = cow_dex::config)]
fun test_assert_config_admin_aborts_without_role() {
    let mut ctx = tx_context::dummy();
    let (config, cap) = config::create_for_testing(&mut ctx);

    config.assert_config_admin(@0xDEAD);

    config.destroy_for_testing(cap);
}

#[test]
#[expected_failure(abort_code = EUNAUTHORIZED, location = cow_dex::config)]
fun test_grant_invalid_role_aborts() {
    let mut ctx = tx_context::dummy();
    let (mut config, cap) = config::create_for_testing(&mut ctx);

    config.grant_role(@0xCAFE, 99, &cap);

    config.destroy_for_testing(cap);
}
