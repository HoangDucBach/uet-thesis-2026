
<a name="deepbook_account"></a>

# Module `deepbook::account`

Account module manages the account data for each user.


-  [Struct `Account`](#deepbook_account_Account)
-  [Function `open_orders`](#deepbook_account_open_orders)
-  [Function `taker_volume`](#deepbook_account_taker_volume)
-  [Function `maker_volume`](#deepbook_account_maker_volume)
-  [Function `total_volume`](#deepbook_account_total_volume)
-  [Function `active_stake`](#deepbook_account_active_stake)
-  [Function `inactive_stake`](#deepbook_account_inactive_stake)
-  [Function `created_proposal`](#deepbook_account_created_proposal)
-  [Function `voted_proposal`](#deepbook_account_voted_proposal)
-  [Function `settled_balances`](#deepbook_account_settled_balances)
-  [Function `empty`](#deepbook_account_empty)
-  [Function `update`](#deepbook_account_update)
-  [Function `process_maker_fill`](#deepbook_account_process_maker_fill)
-  [Function `add_taker_volume`](#deepbook_account_add_taker_volume)
-  [Function `set_voted_proposal`](#deepbook_account_set_voted_proposal)
-  [Function `set_created_proposal`](#deepbook_account_set_created_proposal)
-  [Function `add_settled_balances`](#deepbook_account_add_settled_balances)
-  [Function `add_owed_balances`](#deepbook_account_add_owed_balances)
-  [Function `settle`](#deepbook_account_settle)
-  [Function `add_rebates`](#deepbook_account_add_rebates)
-  [Function `claim_rebates`](#deepbook_account_claim_rebates)
-  [Function `add_order`](#deepbook_account_add_order)
-  [Function `remove_order`](#deepbook_account_remove_order)
-  [Function `add_stake`](#deepbook_account_add_stake)
-  [Function `remove_stake`](#deepbook_account_remove_stake)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price">deepbook::deep_price</a>;
<b>use</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill">deepbook::fill</a>;
<b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
</code></pre>



<a name="deepbook_account_Account"></a>

## Struct `Account`

Account data that is updated every epoch.
One Account struct per BalanceManager object.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>epoch: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>: <a href="../../dependencies/sui/vec_set.md#sui_vec_set_VecSet">sui::vec_set::VecSet</a>&lt;u128&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a>: u128</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>: u128</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a>: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>unclaimed_rebates: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a></code>
</dt>
<dd>
</dd>
<dt>
<code>owed_balances: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_account_open_orders"></a>

## Function `open_orders`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): <a href="../../dependencies/sui/vec_set.md#sui_vec_set_VecSet">sui::vec_set::VecSet</a>&lt;u128&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): VecSet&lt;u128&gt; {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>
}
</code></pre>



</details>

<a name="deepbook_account_taker_volume"></a>

## Function `taker_volume`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): u128
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): u128 {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a>
}
</code></pre>



</details>

<a name="deepbook_account_maker_volume"></a>

## Function `maker_volume`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): u128
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): u128 {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>
}
</code></pre>



</details>

<a name="deepbook_account_total_volume"></a>

## Function `total_volume`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_total_volume">total_volume</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): u128
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_total_volume">total_volume</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): u128 {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a> + self.<a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>
}
</code></pre>



</details>

<a name="deepbook_account_active_stake"></a>

## Function `active_stake`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): u64 {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a>
}
</code></pre>



</details>

<a name="deepbook_account_inactive_stake"></a>

## Function `inactive_stake`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): u64 {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>
}
</code></pre>



</details>

<a name="deepbook_account_created_proposal"></a>

## Function `created_proposal`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): bool {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a>
}
</code></pre>



</details>

<a name="deepbook_account_voted_proposal"></a>

## Function `voted_proposal`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): Option&lt;ID&gt; {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a>
}
</code></pre>



</details>

<a name="deepbook_account_settled_balances"></a>

## Function `settled_balances`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>(self: &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): Balances {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>
}
</code></pre>



</details>

<a name="deepbook_account_empty"></a>

## Function `empty`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_empty">empty</a>(ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_empty">empty</a>(ctx: &TxContext): <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a> {
    <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a> {
        epoch: ctx.epoch(),
        <a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>: vec_set::empty(),
        <a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a>: 0,
        <a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>: 0,
        <a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a>: 0,
        <a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>: 0,
        <a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a>: <b>false</b>,
        <a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a>: option::none(),
        unclaimed_rebates: balances::empty(),
        <a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>: balances::empty(),
        owed_balances: balances::empty(),
    }
}
</code></pre>



</details>

<a name="deepbook_account_update"></a>

## Function `update`

Update the account data for the new epoch.
Returns the previous epoch, maker volume, and active stake.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_update">update</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (u64, u128, u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_update">update</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, ctx: &TxContext): (u64, u128, u64) {
    <b>if</b> (self.epoch == ctx.epoch()) <b>return</b> (0, 0, 0);
    <b>let</b> prev_epoch = self.epoch;
    <b>let</b> prev_maker_volume = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a>;
    <b>let</b> prev_active_stake = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a>;
    self.epoch = ctx.epoch();
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a> = 0;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a> = 0;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a> = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a> + self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a> = 0;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a> = <b>false</b>;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a> = option::none();
    (prev_epoch, prev_maker_volume, prev_active_stake)
}
</code></pre>



</details>

<a name="deepbook_account_process_maker_fill"></a>

## Function `process_maker_fill`

Given a fill, update the account balances and volumes as the maker.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_process_maker_fill">process_maker_fill</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, fill: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_process_maker_fill">process_maker_fill</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, fill: &Fill) {
    <b>let</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a> = fill.get_settled_maker_quantities();
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>.add_balances(<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>);
    <b>if</b> (!fill.expired()) {
        self.<a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a> = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_maker_volume">maker_volume</a> + (fill.base_quantity() <b>as</b> u128);
    };
    <b>if</b> (fill.expired() || fill.completed()) {
        self.<a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>.remove(&fill.maker_order_id());
    }
}
</code></pre>



</details>

<a name="deepbook_account_add_taker_volume"></a>

## Function `add_taker_volume`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_taker_volume">add_taker_volume</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, volume: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_taker_volume">add_taker_volume</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, volume: u64) {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a> = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_taker_volume">taker_volume</a> + (volume <b>as</b> u128);
}
</code></pre>



</details>

<a name="deepbook_account_set_voted_proposal"></a>

## Function `set_voted_proposal`

Set the voted proposal for the account and return the
previous proposal.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_set_voted_proposal">set_voted_proposal</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, proposal: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;): <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_set_voted_proposal">set_voted_proposal</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, proposal: Option&lt;ID&gt;): Option&lt;ID&gt; {
    <b>let</b> prev_proposal = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a>;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a> = proposal;
    prev_proposal
}
</code></pre>



</details>

<a name="deepbook_account_set_created_proposal"></a>

## Function `set_created_proposal`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_set_created_proposal">set_created_proposal</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, created: bool)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_set_created_proposal">set_created_proposal</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, created: bool) {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_created_proposal">created_proposal</a> = created;
}
</code></pre>



</details>

<a name="deepbook_account_add_settled_balances"></a>

## Function `add_settled_balances`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_settled_balances">add_settled_balances</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, balances: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_settled_balances">add_settled_balances</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, balances: Balances) {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>.add_balances(balances);
}
</code></pre>



</details>

<a name="deepbook_account_add_owed_balances"></a>

## Function `add_owed_balances`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_owed_balances">add_owed_balances</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, balances: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_owed_balances">add_owed_balances</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, balances: Balances) {
    self.owed_balances.add_balances(balances);
}
</code></pre>



</details>

<a name="deepbook_account_settle"></a>

## Function `settle`

Settle the account balances. Returns the settled and
owed balances by this account. Vault uses these values
to perform any necessary transfers.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_settle">settle</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_settle">settle</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): (Balances, Balances) {
    <b>let</b> settled = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>.reset();
    <b>let</b> owed = self.owed_balances.reset();
    (settled, owed)
}
</code></pre>



</details>

<a name="deepbook_account_add_rebates"></a>

## Function `add_rebates`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_rebates">add_rebates</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, rebates: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_rebates">add_rebates</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, rebates: Balances) {
    self.unclaimed_rebates.add_balances(rebates);
}
</code></pre>



</details>

<a name="deepbook_account_claim_rebates"></a>

## Function `claim_rebates`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_claim_rebates">claim_rebates</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_claim_rebates">claim_rebates</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>): Balances {
    <b>let</b> rebate_amount = self.unclaimed_rebates;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>.add_balances(self.unclaimed_rebates);
    self.unclaimed_rebates.reset();
    rebate_amount
}
</code></pre>



</details>

<a name="deepbook_account_add_order"></a>

## Function `add_order`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_order">add_order</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, order_id: u128)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_order">add_order</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, order_id: u128) {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>.insert(order_id);
}
</code></pre>



</details>

<a name="deepbook_account_remove_order"></a>

## Function `remove_order`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_remove_order">remove_order</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, order_id: u128)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_remove_order">remove_order</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, order_id: u128) {
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_open_orders">open_orders</a>.remove(&order_id)
}
</code></pre>



</details>

<a name="deepbook_account_add_stake"></a>

## Function `add_stake`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_stake">add_stake</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>, stake: u64): (u64, u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_add_stake">add_stake</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>, stake: u64): (u64, u64) {
    <b>let</b> stake_before = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a> + self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a> = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a> + stake;
    self.owed_balances.add_deep(stake);
    (stake_before, self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a> + self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>)
}
</code></pre>



</details>

<a name="deepbook_account_remove_stake"></a>

## Function `remove_stake`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_remove_stake">remove_stake</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_remove_stake">remove_stake</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">Account</a>) {
    <b>let</b> stake_before = self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a> + self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a>;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_active_stake">active_stake</a> = 0;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_inactive_stake">inactive_stake</a> = 0;
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_voted_proposal">voted_proposal</a> = option::none();
    self.<a href="../../dependencies/deepbook/account.md#deepbook_account_settled_balances">settled_balances</a>.add_deep(stake_before);
}
</code></pre>



</details>
