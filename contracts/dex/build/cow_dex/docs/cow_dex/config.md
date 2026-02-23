
<a name="cow_dex_config"></a>

# Module `cow_dex::config`



-  [Struct `AdminCap`](#cow_dex_config_AdminCap)
-  [Struct `ACL`](#cow_dex_config_ACL)
-  [Struct `GlobalConfig`](#cow_dex_config_GlobalConfig)
-  [Struct `UpdateMinBondEvent`](#cow_dex_config_UpdateMinBondEvent)
-  [Struct `UpdateCommitDurationEvent`](#cow_dex_config_UpdateCommitDurationEvent)
-  [Struct `UpdateGracePeriodEvent`](#cow_dex_config_UpdateGracePeriodEvent)
-  [Struct `UpdateProtocolFeeEvent`](#cow_dex_config_UpdateProtocolFeeEvent)
-  [Struct `RoleGrantedEvent`](#cow_dex_config_RoleGrantedEvent)
-  [Struct `RoleRevokedEvent`](#cow_dex_config_RoleRevokedEvent)
-  [Constants](#@Constants_0)
-  [Function `init_config`](#cow_dex_config_init_config)
-  [Function `set_min_bond`](#cow_dex_config_set_min_bond)
-  [Function `set_commit_duration`](#cow_dex_config_set_commit_duration)
-  [Function `set_grace_period`](#cow_dex_config_set_grace_period)
-  [Function `set_protocol_fee`](#cow_dex_config_set_protocol_fee)
-  [Function `grant_role`](#cow_dex_config_grant_role)
-  [Function `revoke_role`](#cow_dex_config_revoke_role)
-  [Function `has_role`](#cow_dex_config_has_role)
-  [Function `assert_config_admin`](#cow_dex_config_assert_config_admin)
-  [Function `min_bond`](#cow_dex_config_min_bond)
-  [Function `commit_duration_ms`](#cow_dex_config_commit_duration_ms)
-  [Function `grace_period_ms`](#cow_dex_config_grace_period_ms)
-  [Function `protocol_fee_bps`](#cow_dex_config_protocol_fee_bps)
-  [Function `version`](#cow_dex_config_version)
-  [Function `role_config_admin`](#cow_dex_config_role_config_admin)


<pre><code><b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
</code></pre>



<a name="cow_dex_config_AdminCap"></a>

## Struct `AdminCap`

Administrative capability for configuration management.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a> <b>has</b> key, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_ACL"></a>

## Struct `ACL`

Access control list managing protocol roles.
* <code>members</code>: Table mapping address → vector of roles.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_ACL">ACL</a> <b>has</b> store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>members: <a href="../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<b>address</b>, vector&lt;u64&gt;&gt;</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_GlobalConfig"></a>

## Struct `GlobalConfig`

Global protocol configuration.
* <code>id</code>: Unique identifier.
* <code><a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a></code>: Minimum SUI bond required from solvers.
* <code><a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a></code>: Duration of commit phase.
* <code><a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a></code>: Grace period for winner execution.
* <code><a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a></code>: Protocol fee in basis points.
* <code>acl</code>: Access control list.
* <code><a href="../cow_dex/config.md#cow_dex_config_version">version</a></code>: Protocol version for upgrade tracking.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a> <b>has</b> key, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>acl: <a href="../cow_dex/config.md#cow_dex_config_ACL">cow_dex::config::ACL</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/config.md#cow_dex_config_version">version</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_UpdateMinBondEvent"></a>

## Struct `UpdateMinBondEvent`

Emitted when minimum bond is updated.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_UpdateMinBondEvent">UpdateMinBondEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>old_value: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>new_value: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_UpdateCommitDurationEvent"></a>

## Struct `UpdateCommitDurationEvent`

Emitted when commit duration is updated.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_UpdateCommitDurationEvent">UpdateCommitDurationEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>old_value: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>new_value: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_UpdateGracePeriodEvent"></a>

## Struct `UpdateGracePeriodEvent`

Emitted when grace period is updated.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_UpdateGracePeriodEvent">UpdateGracePeriodEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>old_value: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>new_value: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_UpdateProtocolFeeEvent"></a>

## Struct `UpdateProtocolFeeEvent`

Emitted when protocol fee is updated.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_UpdateProtocolFeeEvent">UpdateProtocolFeeEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>old_value: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>new_value: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_RoleGrantedEvent"></a>

## Struct `RoleGrantedEvent`

Emitted when role is granted to an address.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_RoleGrantedEvent">RoleGrantedEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><b>address</b>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>role: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_config_RoleRevokedEvent"></a>

## Struct `RoleRevokedEvent`

Emitted when role is revoked from an address.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/config.md#cow_dex_config_RoleRevokedEvent">RoleRevokedEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><b>address</b>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>role: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="cow_dex_config_INITIAL_VERSION"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_INITIAL_VERSION">INITIAL_VERSION</a>: u64 = 1;
</code></pre>



<a name="cow_dex_config_MAX_PROTOCOL_FEE_BPS"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_MAX_PROTOCOL_FEE_BPS">MAX_PROTOCOL_FEE_BPS</a>: u64 = 10000;
</code></pre>



<a name="cow_dex_config_DEFAULT_MIN_BOND"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_MIN_BOND">DEFAULT_MIN_BOND</a>: u64 = 1000000000;
</code></pre>



<a name="cow_dex_config_DEFAULT_COMMIT_DURATION_MS"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_COMMIT_DURATION_MS">DEFAULT_COMMIT_DURATION_MS</a>: u64 = 2000;
</code></pre>



<a name="cow_dex_config_DEFAULT_GRACE_PERIOD_MS"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_GRACE_PERIOD_MS">DEFAULT_GRACE_PERIOD_MS</a>: u64 = 5000;
</code></pre>



<a name="cow_dex_config_DEFAULT_PROTOCOL_FEE_BPS"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_PROTOCOL_FEE_BPS">DEFAULT_PROTOCOL_FEE_BPS</a>: u64 = 100;
</code></pre>



<a name="cow_dex_config_ROLE_CONFIG_ADMIN"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_ROLE_CONFIG_ADMIN">ROLE_CONFIG_ADMIN</a>: u64 = 0;
</code></pre>



<a name="cow_dex_config_EUnauthorized"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_EUnauthorized">EUnauthorized</a>: u64 = 0;
</code></pre>



<a name="cow_dex_config_EInvalidFeeRate"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_EInvalidFeeRate">EInvalidFeeRate</a>: u64 = 1;
</code></pre>



<a name="cow_dex_config_EInvalidBondAmount"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_EInvalidBondAmount">EInvalidBondAmount</a>: u64 = 2;
</code></pre>



<a name="cow_dex_config_EInvalidDuration"></a>



<pre><code><b>const</b> <a href="../cow_dex/config.md#cow_dex_config_EInvalidDuration">EInvalidDuration</a>: u64 = 3;
</code></pre>



<a name="cow_dex_config_init_config"></a>

## Function `init_config`

Initialize the global configuration and admin capability.
Called once during protocol setup.
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_init_config">init_config</a>(ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, <a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_init_config">init_config</a>(ctx: &<b>mut</b> TxContext): (<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, <a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>) {
    <b>let</b> admin_cap = <a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a> {
        id: object::new(ctx),
    };
    <b>let</b> <a href="../cow_dex/config.md#cow_dex_config">config</a> = <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a> {
        id: object::new(ctx),
        <a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a>: <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_MIN_BOND">DEFAULT_MIN_BOND</a>,
        <a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a>: <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_COMMIT_DURATION_MS">DEFAULT_COMMIT_DURATION_MS</a>,
        <a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a>: <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_GRACE_PERIOD_MS">DEFAULT_GRACE_PERIOD_MS</a>,
        <a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a>: <a href="../cow_dex/config.md#cow_dex_config_DEFAULT_PROTOCOL_FEE_BPS">DEFAULT_PROTOCOL_FEE_BPS</a>,
        acl: <a href="../cow_dex/config.md#cow_dex_config_ACL">ACL</a> { members: table::new(ctx) },
        <a href="../cow_dex/config.md#cow_dex_config_version">version</a>: <a href="../cow_dex/config.md#cow_dex_config_INITIAL_VERSION">INITIAL_VERSION</a>,
    };
    (<a href="../cow_dex/config.md#cow_dex_config">config</a>, admin_cap)
}
</code></pre>



</details>

<a name="cow_dex_config_set_min_bond"></a>

## Function `set_min_bond`

Update minimum bond amount.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code>new_min_bond</code>: New minimum bond in base units.
* <code>_cap</code>: AdminCap for authorization.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_min_bond">set_min_bond</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, new_min_bond: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_min_bond">set_min_bond</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, new_min_bond: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>) {
    <b>assert</b>!(new_min_bond &gt; 0, <a href="../cow_dex/config.md#cow_dex_config_EInvalidBondAmount">EInvalidBondAmount</a>);
    <b>let</b> old_value = <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a>;
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a> = new_min_bond;
    <a href="../dependencies/sui/event.md#sui_event_emit">sui::event::emit</a>(<a href="../cow_dex/config.md#cow_dex_config_UpdateMinBondEvent">UpdateMinBondEvent</a> {
        old_value,
        new_value: new_min_bond,
    });
}
</code></pre>



</details>

<a name="cow_dex_config_set_commit_duration"></a>

## Function `set_commit_duration`

Update commit phase duration.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code>new_commit_duration_ms</code>: New duration in milliseconds.
* <code>_cap</code>: AdminCap for authorization.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_commit_duration">set_commit_duration</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, new_commit_duration_ms: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_commit_duration">set_commit_duration</a>(
    <a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>,
    new_commit_duration_ms: u64,
    _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>,
) {
    <b>assert</b>!(new_commit_duration_ms &gt; 0, <a href="../cow_dex/config.md#cow_dex_config_EInvalidDuration">EInvalidDuration</a>);
    <b>let</b> old_value = <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a>;
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a> = new_commit_duration_ms;
    <a href="../dependencies/sui/event.md#sui_event_emit">sui::event::emit</a>(<a href="../cow_dex/config.md#cow_dex_config_UpdateCommitDurationEvent">UpdateCommitDurationEvent</a> {
        old_value,
        new_value: new_commit_duration_ms,
    });
}
</code></pre>



</details>

<a name="cow_dex_config_set_grace_period"></a>

## Function `set_grace_period`

Update grace period for winner execution.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code>new_grace_period_ms</code>: New grace period in milliseconds.
* <code>_cap</code>: AdminCap for authorization.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_grace_period">set_grace_period</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, new_grace_period_ms: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_grace_period">set_grace_period</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, new_grace_period_ms: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>) {
    <b>assert</b>!(new_grace_period_ms &gt; 0, <a href="../cow_dex/config.md#cow_dex_config_EInvalidDuration">EInvalidDuration</a>);
    <b>let</b> old_value = <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a>;
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a> = new_grace_period_ms;
    <a href="../dependencies/sui/event.md#sui_event_emit">sui::event::emit</a>(<a href="../cow_dex/config.md#cow_dex_config_UpdateGracePeriodEvent">UpdateGracePeriodEvent</a> {
        old_value,
        new_value: new_grace_period_ms,
    });
}
</code></pre>



</details>

<a name="cow_dex_config_set_protocol_fee"></a>

## Function `set_protocol_fee`

Update protocol fee rate.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code>new_protocol_fee_bps</code>: New fee in basis points (0-10000).
* <code>_cap</code>: AdminCap for authorization.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_protocol_fee">set_protocol_fee</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, new_protocol_fee_bps: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_set_protocol_fee">set_protocol_fee</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, new_protocol_fee_bps: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>) {
    <b>assert</b>!(new_protocol_fee_bps &lt;= <a href="../cow_dex/config.md#cow_dex_config_MAX_PROTOCOL_FEE_BPS">MAX_PROTOCOL_FEE_BPS</a>, <a href="../cow_dex/config.md#cow_dex_config_EInvalidFeeRate">EInvalidFeeRate</a>);
    <b>let</b> old_value = <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a>;
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a> = new_protocol_fee_bps;
    <a href="../dependencies/sui/event.md#sui_event_emit">sui::event::emit</a>(<a href="../cow_dex/config.md#cow_dex_config_UpdateProtocolFeeEvent">UpdateProtocolFeeEvent</a> {
        old_value,
        new_value: new_protocol_fee_bps,
    });
}
</code></pre>



</details>

<a name="cow_dex_config_grant_role"></a>

## Function `grant_role`

Grant a role to an address.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code><b>address</b></code>: Address to grant role to.
* <code>role</code>: Role ID to grant (must be ROLE_CONFIG_ADMIN).
* <code>_cap</code>: AdminCap for authorization.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_grant_role">grant_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, <b>address</b>: <b>address</b>, role: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_grant_role">grant_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, <b>address</b>: <b>address</b>, role: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>) {
    <b>assert</b>!(role == <a href="../cow_dex/config.md#cow_dex_config_ROLE_CONFIG_ADMIN">ROLE_CONFIG_ADMIN</a>, <a href="../cow_dex/config.md#cow_dex_config_EUnauthorized">EUnauthorized</a>);
    <b>let</b> acl = &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config">config</a>.acl;
    <b>if</b> (!table::contains(&acl.members, <b>address</b>)) {
        table::add(&<b>mut</b> acl.members, <b>address</b>, vector::empty());
    };
    <b>let</b> roles = table::borrow_mut(&<b>mut</b> acl.members, <b>address</b>);
    <b>if</b> (!vector::contains(roles, &role)) {
        vector::push_back(roles, role);
    };
    <a href="../dependencies/sui/event.md#sui_event_emit">sui::event::emit</a>(<a href="../cow_dex/config.md#cow_dex_config_RoleGrantedEvent">RoleGrantedEvent</a> { <b>address</b>, role });
}
</code></pre>



</details>

<a name="cow_dex_config_revoke_role"></a>

## Function `revoke_role`

Revoke a role from an address.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code><b>address</b></code>: Address to revoke role from.
* <code>role</code>: Role ID to revoke (must be ROLE_CONFIG_ADMIN).
* <code>_cap</code>: AdminCap for authorization.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_revoke_role">revoke_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, <b>address</b>: <b>address</b>, role: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">cow_dex::config::AdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_revoke_role">revoke_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, <b>address</b>: <b>address</b>, role: u64, _cap: &<a href="../cow_dex/config.md#cow_dex_config_AdminCap">AdminCap</a>) {
    <b>assert</b>!(role == <a href="../cow_dex/config.md#cow_dex_config_ROLE_CONFIG_ADMIN">ROLE_CONFIG_ADMIN</a>, <a href="../cow_dex/config.md#cow_dex_config_EUnauthorized">EUnauthorized</a>);
    <b>let</b> acl = &<b>mut</b> <a href="../cow_dex/config.md#cow_dex_config">config</a>.acl;
    <b>if</b> (!table::contains(&acl.members, <b>address</b>)) {
        <b>return</b>
    };
    <b>let</b> roles = table::borrow_mut(&<b>mut</b> acl.members, <b>address</b>);
    <b>let</b> <b>mut</b> idx = 0;
    <b>let</b> len = vector::length(roles);
    <b>let</b> <b>mut</b> found_idx = len;
    <b>while</b> (idx &lt; len) {
        <b>if</b> (*vector::borrow(roles, idx) == role) {
            found_idx = idx;
            <b>break</b>
        };
        idx = idx + 1;
    };
    <b>if</b> (found_idx &lt; len) {
        vector::remove(roles, found_idx);
    };
    <a href="../dependencies/sui/event.md#sui_event_emit">sui::event::emit</a>(<a href="../cow_dex/config.md#cow_dex_config_RoleRevokedEvent">RoleRevokedEvent</a> { <b>address</b>, role });
}
</code></pre>



</details>

<a name="cow_dex_config_has_role"></a>

## Function `has_role`

Check if address has a specific role.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code><b>address</b></code>: Address to check.
* <code>role</code>: Role ID to check.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_has_role">has_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, <b>address</b>: <b>address</b>, role: u64): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_has_role">has_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, <b>address</b>: <b>address</b>, role: u64): bool {
    <b>let</b> acl = &<a href="../cow_dex/config.md#cow_dex_config">config</a>.acl;
    <b>if</b> (!table::contains(&acl.members, <b>address</b>)) {
        <b>return</b> <b>false</b>
    };
    <b>let</b> roles = table::borrow(&acl.members, <b>address</b>);
    vector::contains(roles, &role)
}
</code></pre>



</details>

<a name="cow_dex_config_assert_config_admin"></a>

## Function `assert_config_admin`

Assert that address has ROLE_CONFIG_ADMIN.
* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: The GlobalConfig.
* <code><b>address</b></code>: Address to check.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_assert_config_admin">assert_config_admin</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, <b>address</b>: <b>address</b>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_assert_config_admin">assert_config_admin</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>, <b>address</b>: <b>address</b>) {
    <b>assert</b>!(<a href="../cow_dex/config.md#cow_dex_config_has_role">has_role</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>, <b>address</b>, <a href="../cow_dex/config.md#cow_dex_config_ROLE_CONFIG_ADMIN">ROLE_CONFIG_ADMIN</a>), <a href="../cow_dex/config.md#cow_dex_config_EUnauthorized">EUnauthorized</a>);
}
</code></pre>



</details>

<a name="cow_dex_config_min_bond"></a>

## Function `min_bond`

Get minimum bond amount.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>): u64 {
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_min_bond">min_bond</a>
}
</code></pre>



</details>

<a name="cow_dex_config_commit_duration_ms"></a>

## Function `commit_duration_ms`

Get commit phase duration.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>): u64 {
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_commit_duration_ms">commit_duration_ms</a>
}
</code></pre>



</details>

<a name="cow_dex_config_grace_period_ms"></a>

## Function `grace_period_ms`

Get grace period for execution.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>): u64 {
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_grace_period_ms">grace_period_ms</a>
}
</code></pre>



</details>

<a name="cow_dex_config_protocol_fee_bps"></a>

## Function `protocol_fee_bps`

Get protocol fee in basis points.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>): u64 {
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_protocol_fee_bps">protocol_fee_bps</a>
}
</code></pre>



</details>

<a name="cow_dex_config_version"></a>

## Function `version`

Get current version.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_version">version</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_version">version</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">GlobalConfig</a>): u64 {
    <a href="../cow_dex/config.md#cow_dex_config">config</a>.<a href="../cow_dex/config.md#cow_dex_config_version">version</a>
}
</code></pre>



</details>

<a name="cow_dex_config_role_config_admin"></a>

## Function `role_config_admin`

Get ROLE_CONFIG_ADMIN constant.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_role_config_admin">role_config_admin</a>(): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/config.md#cow_dex_config_role_config_admin">role_config_admin</a>(): u64 {
    <a href="../cow_dex/config.md#cow_dex_config_ROLE_CONFIG_ADMIN">ROLE_CONFIG_ADMIN</a>
}
</code></pre>



</details>
