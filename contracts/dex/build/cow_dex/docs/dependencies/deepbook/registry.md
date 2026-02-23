
<a name="deepbook_registry"></a>

# Module `deepbook::registry`

Registry holds all created pools.


-  [Struct `REGISTRY`](#deepbook_registry_REGISTRY)
-  [Struct `DeepbookAdminCap`](#deepbook_registry_DeepbookAdminCap)
-  [Struct `Registry`](#deepbook_registry_Registry)
-  [Struct `RegistryInner`](#deepbook_registry_RegistryInner)
-  [Struct `PoolKey`](#deepbook_registry_PoolKey)
-  [Struct `StableCoinKey`](#deepbook_registry_StableCoinKey)
-  [Struct `BalanceManagerKey`](#deepbook_registry_BalanceManagerKey)
-  [Struct `AppKey`](#deepbook_registry_AppKey)
-  [Constants](#@Constants_0)
-  [Function `authorize_app`](#deepbook_registry_authorize_app)
-  [Function `deauthorize_app`](#deepbook_registry_deauthorize_app)
-  [Function `assert_app_is_authorized`](#deepbook_registry_assert_app_is_authorized)
-  [Function `init`](#deepbook_registry_init)
-  [Function `set_treasury_address`](#deepbook_registry_set_treasury_address)
-  [Function `enable_version`](#deepbook_registry_enable_version)
-  [Function `disable_version`](#deepbook_registry_disable_version)
-  [Function `add_stablecoin`](#deepbook_registry_add_stablecoin)
-  [Function `remove_stablecoin`](#deepbook_registry_remove_stablecoin)
-  [Function `init_balance_manager_map`](#deepbook_registry_init_balance_manager_map)
-  [Function `get_balance_manager_ids`](#deepbook_registry_get_balance_manager_ids)
-  [Function `is_stablecoin`](#deepbook_registry_is_stablecoin)
-  [Function `load_inner_mut`](#deepbook_registry_load_inner_mut)
-  [Function `register_pool`](#deepbook_registry_register_pool)
-  [Function `unregister_pool`](#deepbook_registry_unregister_pool)
-  [Function `load_inner`](#deepbook_registry_load_inner)
-  [Function `add_balance_manager`](#deepbook_registry_add_balance_manager)
-  [Function `get_pool_id`](#deepbook_registry_get_pool_id)
-  [Function `treasury_address`](#deepbook_registry_treasury_address)
-  [Function `allowed_versions`](#deepbook_registry_allowed_versions)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../../dependencies/sui/bag.md#sui_bag">sui::bag</a>;
<b>use</b> <a href="../../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
<b>use</b> <a href="../../dependencies/sui/versioned.md#sui_versioned">sui::versioned</a>;
</code></pre>



<a name="deepbook_registry_REGISTRY"></a>

## Struct `REGISTRY`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_REGISTRY">REGISTRY</a> <b>has</b> drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="deepbook_registry_DeepbookAdminCap"></a>

## Struct `DeepbookAdminCap`

DeepbookAdminCap is used to call admin functions.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a> <b>has</b> key, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>id: <a href="../../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_registry_Registry"></a>

## Struct `Registry`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a> <b>has</b> key
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>id: <a href="../../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>inner: <a href="../../dependencies/sui/versioned.md#sui_versioned_Versioned">sui::versioned::Versioned</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_registry_RegistryInner"></a>

## Struct `RegistryInner`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> <b>has</b> store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>: <a href="../../dependencies/sui/vec_set.md#sui_vec_set_VecSet">sui::vec_set::VecSet</a>&lt;u64&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>pools: <a href="../../dependencies/sui/bag.md#sui_bag_Bag">sui::bag::Bag</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>: <b>address</b></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_registry_PoolKey"></a>

## Struct `PoolKey`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>base: <a href="../../dependencies/std/type_name.md#std_type_name_TypeName">std::type_name::TypeName</a></code>
</dt>
<dd>
</dd>
<dt>
<code>quote: <a href="../../dependencies/std/type_name.md#std_type_name_TypeName">std::type_name::TypeName</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_registry_StableCoinKey"></a>

## Struct `StableCoinKey`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="deepbook_registry_BalanceManagerKey"></a>

## Struct `BalanceManagerKey`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_BalanceManagerKey">BalanceManagerKey</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="deepbook_registry_AppKey"></a>

## Struct `AppKey`

An authorization Key kept in the Registry - allows applications access protected features of the DeepBook
The <code>App</code> type parameter is a witness which should be defined in the original module


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_AppKey">AppKey</a>&lt;<b>phantom</b> App: drop&gt; <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="deepbook_registry_EPoolAlreadyExists"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPoolAlreadyExists">EPoolAlreadyExists</a>: u64 = 1;
</code></pre>



<a name="deepbook_registry_EPoolDoesNotExist"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPoolDoesNotExist">EPoolDoesNotExist</a>: u64 = 2;
</code></pre>



<a name="deepbook_registry_EPackageVersionNotEnabled"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPackageVersionNotEnabled">EPackageVersionNotEnabled</a>: u64 = 3;
</code></pre>



<a name="deepbook_registry_EVersionNotEnabled"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EVersionNotEnabled">EVersionNotEnabled</a>: u64 = 4;
</code></pre>



<a name="deepbook_registry_EVersionAlreadyEnabled"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EVersionAlreadyEnabled">EVersionAlreadyEnabled</a>: u64 = 5;
</code></pre>



<a name="deepbook_registry_ECannotDisableCurrentVersion"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECannotDisableCurrentVersion">ECannotDisableCurrentVersion</a>: u64 = 6;
</code></pre>



<a name="deepbook_registry_ECoinAlreadyWhitelisted"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECoinAlreadyWhitelisted">ECoinAlreadyWhitelisted</a>: u64 = 7;
</code></pre>



<a name="deepbook_registry_ECoinNotWhitelisted"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECoinNotWhitelisted">ECoinNotWhitelisted</a>: u64 = 8;
</code></pre>



<a name="deepbook_registry_EMaxBalanceManagersReached"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EMaxBalanceManagersReached">EMaxBalanceManagersReached</a>: u64 = 9;
</code></pre>



<a name="deepbook_registry_EAppNotAuthorized"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EAppNotAuthorized">EAppNotAuthorized</a>: u64 = 10;
</code></pre>



<a name="deepbook_registry_authorize_app"></a>

## Function `authorize_app`

Authorize an application to access protected features of the DeepBook.


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_authorize_app">authorize_app</a>&lt;App: drop&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, _admin_cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_authorize_app">authorize_app</a>&lt;App: drop&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, _admin_cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>) {
    self.id.add(<a href="../../dependencies/deepbook/registry.md#deepbook_registry_AppKey">AppKey</a>&lt;App&gt; {}, <b>true</b>);
}
</code></pre>



</details>

<a name="deepbook_registry_deauthorize_app"></a>

## Function `deauthorize_app`

Deauthorize an application by removing its authorization key.


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_deauthorize_app">deauthorize_app</a>&lt;App: drop&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, _admin_cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_deauthorize_app">deauthorize_app</a>&lt;App: drop&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, _admin_cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>): bool {
    self.id.remove(<a href="../../dependencies/deepbook/registry.md#deepbook_registry_AppKey">AppKey</a>&lt;App&gt; {})
}
</code></pre>



</details>

<a name="deepbook_registry_assert_app_is_authorized"></a>

## Function `assert_app_is_authorized`

Assert that an application is authorized to access protected features of DeepBook.


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_assert_app_is_authorized">assert_app_is_authorized</a>&lt;App: drop&gt;(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_assert_app_is_authorized">assert_app_is_authorized</a>&lt;App: drop&gt;(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>) {
    <b>assert</b>!(self.id.exists_(<a href="../../dependencies/deepbook/registry.md#deepbook_registry_AppKey">AppKey</a>&lt;App&gt; {}), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EAppNotAuthorized">EAppNotAuthorized</a>);
}
</code></pre>



</details>

<a name="deepbook_registry_init"></a>

## Function `init`



<pre><code><b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_init">init</a>(_: <a href="../../dependencies/deepbook/registry.md#deepbook_registry_REGISTRY">deepbook::registry::REGISTRY</a>, ctx: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_init">init</a>(_: <a href="../../dependencies/deepbook/registry.md#deepbook_registry_REGISTRY">REGISTRY</a>, ctx: &<b>mut</b> TxContext) {
    <b>let</b> registry_inner = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> {
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>: vec_set::singleton(constants::current_version()),
        pools: bag::new(ctx),
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>: ctx.sender(),
    };
    <b>let</b> registry = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a> {
        id: object::new(ctx),
        inner: versioned::create(
            constants::current_version(),
            registry_inner,
            ctx,
        ),
    };
    transfer::share_object(registry);
    <b>let</b> admin = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a> { id: object::new(ctx) };
    transfer::public_transfer(admin, ctx.sender());
}
</code></pre>



</details>

<a name="deepbook_registry_set_treasury_address"></a>

## Function `set_treasury_address`

Sets the treasury address where the pool creation fees are sent
By default, the treasury address is the publisher of the deepbook package


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_set_treasury_address">set_treasury_address</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, <a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>: <b>address</b>, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_set_treasury_address">set_treasury_address</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>,
    <a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>: <b>address</b>,
    _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>,
) {
    <b>let</b> self = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a> = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>;
}
</code></pre>



</details>

<a name="deepbook_registry_enable_version"></a>

## Function `enable_version`

Enables a package version
Only Admin can enable a package version
This function does not have version restrictions


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_enable_version">enable_version</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, version: u64, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_enable_version">enable_version</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, version: u64, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>) {
    <b>let</b> self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.inner.load_value_mut();
    <b>assert</b>!(!self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>.contains(&version), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EVersionAlreadyEnabled">EVersionAlreadyEnabled</a>);
    self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>.insert(version);
}
</code></pre>



</details>

<a name="deepbook_registry_disable_version"></a>

## Function `disable_version`

Disables a package version
Only Admin can disable a package version
This function does not have version restrictions


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_disable_version">disable_version</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, version: u64, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_disable_version">disable_version</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, version: u64, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>) {
    <b>let</b> self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.inner.load_value_mut();
    <b>assert</b>!(version != constants::current_version(), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECannotDisableCurrentVersion">ECannotDisableCurrentVersion</a>);
    <b>assert</b>!(self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>.contains(&version), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EVersionNotEnabled">EVersionNotEnabled</a>);
    self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>.remove(&version);
}
</code></pre>



</details>

<a name="deepbook_registry_add_stablecoin"></a>

## Function `add_stablecoin`

Adds a stablecoin to the whitelist
Only Admin can add stablecoin


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_add_stablecoin">add_stablecoin</a>&lt;StableCoin&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_add_stablecoin">add_stablecoin</a>&lt;StableCoin&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>) {
    <b>let</b> _: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    <b>let</b> stable_type = type_name::with_defining_ids&lt;StableCoin&gt;();
    <b>if</b> (
        !dynamic_field::exists_(
            &self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
        )
    ) {
        dynamic_field::add(
            &<b>mut</b> self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
            vec_set::singleton(stable_type),
        );
    } <b>else</b> {
        <b>let</b> stable_coins: &<b>mut</b> VecSet&lt;TypeName&gt; = dynamic_field::borrow_mut(
            &<b>mut</b> self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
        );
        <b>assert</b>!(!stable_coins.contains(&stable_type), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECoinAlreadyWhitelisted">ECoinAlreadyWhitelisted</a>);
        stable_coins.insert(stable_type);
    };
}
</code></pre>



</details>

<a name="deepbook_registry_remove_stablecoin"></a>

## Function `remove_stablecoin`

Removes a stablecoin from the whitelist
Only Admin can remove stablecoin


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_remove_stablecoin">remove_stablecoin</a>&lt;StableCoin&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_remove_stablecoin">remove_stablecoin</a>&lt;StableCoin&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>) {
    <b>let</b> _: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    <b>let</b> stable_type = type_name::with_defining_ids&lt;StableCoin&gt;();
    <b>assert</b>!(
        dynamic_field::exists_(
            &self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
        ),
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECoinNotWhitelisted">ECoinNotWhitelisted</a>,
    );
    <b>let</b> stable_coins: &<b>mut</b> VecSet&lt;TypeName&gt; = dynamic_field::borrow_mut(
        &<b>mut</b> self.id,
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
    );
    <b>assert</b>!(stable_coins.contains(&stable_type), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_ECoinNotWhitelisted">ECoinNotWhitelisted</a>);
    stable_coins.remove(&stable_type);
}
</code></pre>



</details>

<a name="deepbook_registry_init_balance_manager_map"></a>

## Function `init_balance_manager_map`

Adds the BalanceManagerKey dynamic field to the registry


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_init_balance_manager_map">init_balance_manager_map</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">deepbook::registry::DeepbookAdminCap</a>, ctx: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_init_balance_manager_map">init_balance_manager_map</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>,
    _cap: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_DeepbookAdminCap">DeepbookAdminCap</a>,
    ctx: &<b>mut</b> TxContext,
) {
    <b>let</b> _: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    <b>if</b> (
        !dynamic_field::exists_(
            &self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_BalanceManagerKey">BalanceManagerKey</a> {},
        )
    ) {
        dynamic_field::add(
            &<b>mut</b> self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_BalanceManagerKey">BalanceManagerKey</a> {},
            table::new&lt;<b>address</b>, VecSet&lt;ID&gt;&gt;(ctx),
        );
    };
}
</code></pre>



</details>

<a name="deepbook_registry_get_balance_manager_ids"></a>

## Function `get_balance_manager_ids`

Get the balance manager IDs for a given owner


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_get_balance_manager_ids">get_balance_manager_ids</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, owner: <b>address</b>): <a href="../../dependencies/sui/vec_set.md#sui_vec_set_VecSet">sui::vec_set::VecSet</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_get_balance_manager_ids">get_balance_manager_ids</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, owner: <b>address</b>): VecSet&lt;ID&gt; {
    <b>let</b> balance_manager_map: &Table&lt;<b>address</b>, VecSet&lt;ID&gt;&gt; = dynamic_field::borrow(
        &self.id,
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_BalanceManagerKey">BalanceManagerKey</a> {},
    );
    <b>if</b> (balance_manager_map.contains(owner)) {
        *balance_manager_map.borrow&lt;<b>address</b>, VecSet&lt;ID&gt;&gt;(owner)
    } <b>else</b> {
        vec_set::empty()
    }
}
</code></pre>



</details>

<a name="deepbook_registry_is_stablecoin"></a>

## Function `is_stablecoin`

Returns whether the given coin is whitelisted


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_is_stablecoin">is_stablecoin</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, stable_type: <a href="../../dependencies/std/type_name.md#std_type_name_TypeName">std::type_name::TypeName</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_is_stablecoin">is_stablecoin</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, stable_type: TypeName): bool {
    <b>let</b> _: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner">load_inner</a>();
    <b>if</b> (
        !dynamic_field::exists_(
            &self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
        )
    ) {
        <b>false</b>
    } <b>else</b> {
        <b>let</b> stable_coins: &VecSet&lt;TypeName&gt; = dynamic_field::borrow(
            &self.id,
            <a href="../../dependencies/deepbook/registry.md#deepbook_registry_StableCoinKey">StableCoinKey</a> {},
        );
        stable_coins.contains(&stable_type)
    }
}
</code></pre>



</details>

<a name="deepbook_registry_load_inner_mut"></a>

## Function `load_inner_mut`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>): &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">deepbook::registry::RegistryInner</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>): &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> {
    <b>let</b> inner: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.inner.load_value_mut();
    <b>let</b> package_version = constants::current_version();
    <b>assert</b>!(inner.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>.contains(&package_version), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPackageVersionNotEnabled">EPackageVersionNotEnabled</a>);
    inner
}
</code></pre>



</details>

<a name="deepbook_registry_register_pool"></a>

## Function `register_pool`

Register a new pool in the registry.
Asserts if (Base, Quote) pool already exists or
(Quote, Base) pool already exists.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_register_pool">register_pool</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_register_pool">register_pool</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, pool_id: ID) {
    <b>let</b> self = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    <b>let</b> key = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a> {
        base: type_name::with_defining_ids&lt;QuoteAsset&gt;(),
        quote: type_name::with_defining_ids&lt;BaseAsset&gt;(),
    };
    <b>assert</b>!(!self.pools.contains(key), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPoolAlreadyExists">EPoolAlreadyExists</a>);
    <b>let</b> key = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a> {
        base: type_name::with_defining_ids&lt;BaseAsset&gt;(),
        quote: type_name::with_defining_ids&lt;QuoteAsset&gt;(),
    };
    <b>assert</b>!(!self.pools.contains(key), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPoolAlreadyExists">EPoolAlreadyExists</a>);
    self.pools.add(key, pool_id);
}
</code></pre>



</details>

<a name="deepbook_registry_unregister_pool"></a>

## Function `unregister_pool`

Only admin can call this function


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_unregister_pool">unregister_pool</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_unregister_pool">unregister_pool</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>) {
    <b>let</b> self = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    <b>let</b> key = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a> {
        base: type_name::with_defining_ids&lt;BaseAsset&gt;(),
        quote: type_name::with_defining_ids&lt;QuoteAsset&gt;(),
    };
    <b>assert</b>!(self.pools.contains(key), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPoolDoesNotExist">EPoolDoesNotExist</a>);
    self.pools.remove&lt;<a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a>, ID&gt;(key);
}
</code></pre>



</details>

<a name="deepbook_registry_load_inner"></a>

## Function `load_inner`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner">load_inner</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>): &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">deepbook::registry::RegistryInner</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner">load_inner</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>): &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> {
    <b>let</b> inner: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.inner.load_value();
    <b>let</b> package_version = constants::current_version();
    <b>assert</b>!(inner.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>.contains(&package_version), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPackageVersionNotEnabled">EPackageVersionNotEnabled</a>);
    inner
}
</code></pre>



</details>

<a name="deepbook_registry_add_balance_manager"></a>

## Function `add_balance_manager`

Adds a balance_manager to the registry


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_add_balance_manager">add_balance_manager</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>, owner: <b>address</b>, manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_add_balance_manager">add_balance_manager</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>, owner: <b>address</b>, manager_id: ID) {
    <b>let</b> _: &<b>mut</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_RegistryInner">RegistryInner</a> = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner_mut">load_inner_mut</a>();
    <b>let</b> balance_manager_map: &<b>mut</b> Table&lt;<b>address</b>, VecSet&lt;ID&gt;&gt; = dynamic_field::borrow_mut(
        &<b>mut</b> self.id,
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_BalanceManagerKey">BalanceManagerKey</a> {},
    );
    <b>if</b> (!balance_manager_map.contains(owner)) {
        balance_manager_map.add(owner, vec_set::empty());
    };
    <b>let</b> balance_manager_ids = balance_manager_map.borrow_mut(owner);
    <b>if</b> (!balance_manager_ids.contains(&manager_id)) {
        balance_manager_ids.insert(manager_id);
    };
    <b>assert</b>!(
        balance_manager_ids.length() &lt;= constants::max_balance_managers(),
        <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EMaxBalanceManagersReached">EMaxBalanceManagersReached</a>,
    );
}
</code></pre>



</details>

<a name="deepbook_registry_get_pool_id"></a>

## Function `get_pool_id`

Get the pool id for the given base and quote assets.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_get_pool_id">get_pool_id</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>): <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_get_pool_id">get_pool_id</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>): ID {
    <b>let</b> self = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner">load_inner</a>();
    <b>let</b> key = <a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a> {
        base: type_name::with_defining_ids&lt;BaseAsset&gt;(),
        quote: type_name::with_defining_ids&lt;QuoteAsset&gt;(),
    };
    <b>assert</b>!(self.pools.contains(key), <a href="../../dependencies/deepbook/registry.md#deepbook_registry_EPoolDoesNotExist">EPoolDoesNotExist</a>);
    *self.pools.borrow&lt;<a href="../../dependencies/deepbook/registry.md#deepbook_registry_PoolKey">PoolKey</a>, ID&gt;(key)
}
</code></pre>



</details>

<a name="deepbook_registry_treasury_address"></a>

## Function `treasury_address`

Get the treasury address


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>): <b>address</b>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>): <b>address</b> {
    <b>let</b> self = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner">load_inner</a>();
    self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_treasury_address">treasury_address</a>
}
</code></pre>



</details>

<a name="deepbook_registry_allowed_versions"></a>

## Function `allowed_versions`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">deepbook::registry::Registry</a>): <a href="../../dependencies/sui/vec_set.md#sui_vec_set_VecSet">sui::vec_set::VecSet</a>&lt;u64&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>(self: &<a href="../../dependencies/deepbook/registry.md#deepbook_registry_Registry">Registry</a>): VecSet&lt;u64&gt; {
    <b>let</b> self = self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_load_inner">load_inner</a>();
    self.<a href="../../dependencies/deepbook/registry.md#deepbook_registry_allowed_versions">allowed_versions</a>
}
</code></pre>



</details>
