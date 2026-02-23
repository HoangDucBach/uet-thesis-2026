
<a name="deepbook_fill"></a>

# Module `deepbook::fill`

<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a></code> struct represents the results of a match between two orders.


-  [Struct `Fill`](#deepbook_fill_Fill)
-  [Function `maker_order_id`](#deepbook_fill_maker_order_id)
-  [Function `maker_client_order_id`](#deepbook_fill_maker_client_order_id)
-  [Function `execution_price`](#deepbook_fill_execution_price)
-  [Function `balance_manager_id`](#deepbook_fill_balance_manager_id)
-  [Function `expired`](#deepbook_fill_expired)
-  [Function `completed`](#deepbook_fill_completed)
-  [Function `original_maker_quantity`](#deepbook_fill_original_maker_quantity)
-  [Function `base_quantity`](#deepbook_fill_base_quantity)
-  [Function `taker_is_bid`](#deepbook_fill_taker_is_bid)
-  [Function `quote_quantity`](#deepbook_fill_quote_quantity)
-  [Function `maker_epoch`](#deepbook_fill_maker_epoch)
-  [Function `maker_deep_price`](#deepbook_fill_maker_deep_price)
-  [Function `taker_fee`](#deepbook_fill_taker_fee)
-  [Function `taker_fee_is_deep`](#deepbook_fill_taker_fee_is_deep)
-  [Function `maker_fee`](#deepbook_fill_maker_fee)
-  [Function `maker_fee_is_deep`](#deepbook_fill_maker_fee_is_deep)
-  [Function `new`](#deepbook_fill_new)
-  [Function `get_settled_maker_quantities`](#deepbook_fill_get_settled_maker_quantities)
-  [Function `set_fill_maker_fee`](#deepbook_fill_set_fill_maker_fee)
-  [Function `set_fill_taker_fee`](#deepbook_fill_set_fill_taker_fee)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price">deepbook::deep_price</a>;
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
</code></pre>



<a name="deepbook_fill_Fill"></a>

## Struct `Fill`

Fill struct represents the results of a match between two orders.
It is used to update the state.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>: u128</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>: <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee">taker_fee</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee">maker_fee</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>: bool</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_fill_maker_order_id"></a>

## Function `maker_order_id`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u128
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u128 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>
}
</code></pre>



</details>

<a name="deepbook_fill_maker_client_order_id"></a>

## Function `maker_client_order_id`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>
}
</code></pre>



</details>

<a name="deepbook_fill_execution_price"></a>

## Function `execution_price`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>
}
</code></pre>



</details>

<a name="deepbook_fill_balance_manager_id"></a>

## Function `balance_manager_id`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): ID {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>
}
</code></pre>



</details>

<a name="deepbook_fill_expired"></a>

## Function `expired`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): bool {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>
}
</code></pre>



</details>

<a name="deepbook_fill_completed"></a>

## Function `completed`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): bool {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>
}
</code></pre>



</details>

<a name="deepbook_fill_original_maker_quantity"></a>

## Function `original_maker_quantity`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>
}
</code></pre>



</details>

<a name="deepbook_fill_base_quantity"></a>

## Function `base_quantity`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>
}
</code></pre>



</details>

<a name="deepbook_fill_taker_is_bid"></a>

## Function `taker_is_bid`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): bool {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>
}
</code></pre>



</details>

<a name="deepbook_fill_quote_quantity"></a>

## Function `quote_quantity`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>
}
</code></pre>



</details>

<a name="deepbook_fill_maker_epoch"></a>

## Function `maker_epoch`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>
}
</code></pre>



</details>

<a name="deepbook_fill_maker_deep_price"></a>

## Function `maker_deep_price`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): OrderDeepPrice {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>
}
</code></pre>



</details>

<a name="deepbook_fill_taker_fee"></a>

## Function `taker_fee`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee">taker_fee</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee">taker_fee</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee">taker_fee</a>
}
</code></pre>



</details>

<a name="deepbook_fill_taker_fee_is_deep"></a>

## Function `taker_fee_is_deep`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): bool {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>
}
</code></pre>



</details>

<a name="deepbook_fill_maker_fee"></a>

## Function `maker_fee`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee">maker_fee</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee">maker_fee</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): u64 {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee">maker_fee</a>
}
</code></pre>



</details>

<a name="deepbook_fill_maker_fee_is_deep"></a>

## Function `maker_fee_is_deep`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): bool {
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>
}
</code></pre>



</details>

<a name="deepbook_fill_new"></a>

## Function `new`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_new">new</a>(<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>: u128, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>: u64, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>: u64, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>: bool, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>: bool, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>: u64, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>: u64, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>: u64, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>: bool, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>: u64, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>: <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>: bool, <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>: bool): <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_new">new</a>(
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>: u128,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>: u64,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>: u64,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>: ID,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>: bool,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>: bool,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>: u64,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>: u64,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>: u64,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>: bool,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>: u64,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>: OrderDeepPrice,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>: bool,
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>: bool,
): <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a> {
    <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a> {
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_order_id">maker_order_id</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_client_order_id">maker_client_order_id</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_execution_price">execution_price</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_balance_manager_id">balance_manager_id</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_completed">completed</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_original_maker_quantity">original_maker_quantity</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_epoch">maker_epoch</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_deep_price">maker_deep_price</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee">taker_fee</a>: 0,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a>,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee">maker_fee</a>: 0,
        <a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a>,
    }
}
</code></pre>



</details>

<a name="deepbook_fill_get_settled_maker_quantities"></a>

## Function `get_settled_maker_quantities`

Calculate the quantities to settle for the maker.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_get_settled_maker_quantities">get_settled_maker_quantities</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_get_settled_maker_quantities">get_settled_maker_quantities</a>(self: &<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>): Balances {
    <b>let</b> (base, quote) = <b>if</b> (self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_expired">expired</a>) {
        <b>if</b> (self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>) {
            (self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>, 0)
        } <b>else</b> {
            (0, self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>)
        }
    } <b>else</b> {
        <b>if</b> (self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_is_bid">taker_is_bid</a>) {
            (0, self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_quote_quantity">quote_quantity</a>)
        } <b>else</b> {
            (self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_base_quantity">base_quantity</a>, 0)
        }
    };
    balances::new(base, quote, 0)
}
</code></pre>



</details>

<a name="deepbook_fill_set_fill_maker_fee"></a>

## Function `set_fill_maker_fee`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_set_fill_maker_fee">set_fill_maker_fee</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>, fee: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_set_fill_maker_fee">set_fill_maker_fee</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>, fee: &Balances) {
    <b>if</b> (fee.deep() &gt; 0) {
        self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a> = <b>true</b>;
    } <b>else</b> {
        self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee_is_deep">maker_fee_is_deep</a> = <b>false</b>;
    };
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_maker_fee">maker_fee</a> = fee.non_zero_value();
}
</code></pre>



</details>

<a name="deepbook_fill_set_fill_taker_fee"></a>

## Function `set_fill_taker_fee`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_set_fill_taker_fee">set_fill_taker_fee</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>, fee: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_set_fill_taker_fee">set_fill_taker_fee</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">Fill</a>, fee: &Balances) {
    <b>if</b> (fee.deep() &gt; 0) {
        self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a> = <b>true</b>;
    } <b>else</b> {
        self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee_is_deep">taker_fee_is_deep</a> = <b>false</b>;
    };
    self.<a href="../../dependencies/deepbook/fill.md#deepbook_fill_taker_fee">taker_fee</a> = fee.non_zero_value();
}
</code></pre>



</details>
