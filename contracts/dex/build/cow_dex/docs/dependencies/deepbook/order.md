
<a name="deepbook_order"></a>

# Module `deepbook::order`

Order module defines the order struct and its methods.
All order matching happens in this module.


-  [Struct `Order`](#deepbook_order_Order)
-  [Struct `OrderCanceled`](#deepbook_order_OrderCanceled)
-  [Struct `OrderModified`](#deepbook_order_OrderModified)
-  [Constants](#@Constants_0)
-  [Function `balance_manager_id`](#deepbook_order_balance_manager_id)
-  [Function `order_id`](#deepbook_order_order_id)
-  [Function `client_order_id`](#deepbook_order_client_order_id)
-  [Function `quantity`](#deepbook_order_quantity)
-  [Function `filled_quantity`](#deepbook_order_filled_quantity)
-  [Function `fee_is_deep`](#deepbook_order_fee_is_deep)
-  [Function `order_deep_price`](#deepbook_order_order_deep_price)
-  [Function `epoch`](#deepbook_order_epoch)
-  [Function `status`](#deepbook_order_status)
-  [Function `expire_timestamp`](#deepbook_order_expire_timestamp)
-  [Function `price`](#deepbook_order_price)
-  [Function `new`](#deepbook_order_new)
-  [Function `generate_fill`](#deepbook_order_generate_fill)
-  [Function `modify`](#deepbook_order_modify)
-  [Function `calculate_cancel_refund`](#deepbook_order_calculate_cancel_refund)
-  [Function `locked_balance`](#deepbook_order_locked_balance)
-  [Function `emit_order_canceled`](#deepbook_order_emit_order_canceled)
-  [Function `emit_order_modified`](#deepbook_order_emit_order_modified)
-  [Function `emit_cancel_maker`](#deepbook_order_emit_cancel_maker)
-  [Function `copy_order`](#deepbook_order_copy_order)
-  [Function `set_canceled`](#deepbook_order_set_canceled)
-  [Function `is_bid`](#deepbook_order_is_bid)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price">deepbook::deep_price</a>;
<b>use</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill">deepbook::fill</a>;
<b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/deepbook/utils.md#deepbook_utils">deepbook::utils</a>;
<b>use</b> <a href="../../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../../dependencies/std/u64.md#std_u64">std::u64</a>;
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



<a name="deepbook_order_Order"></a>

## Struct `Order`

Order struct represents the order in the order book. It is optimized for space.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a> <b>has</b> drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>: <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>: u8</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_order_OrderCanceled"></a>

## Struct `OrderCanceled`

Emitted when a maker order is canceled.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_OrderCanceled">OrderCanceled</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>trader: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>original_quantity: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>base_asset_quantity_canceled: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>timestamp: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_order_OrderModified"></a>

## Struct `OrderModified`

Emitted when a maker order is modified.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_OrderModified">OrderModified</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>trader: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>previous_quantity: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>new_quantity: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>timestamp: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="deepbook_order_EInvalidNewQuantity"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_EInvalidNewQuantity">EInvalidNewQuantity</a>: u64 = 0;
</code></pre>



<a name="deepbook_order_EOrderExpired"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_EOrderExpired">EOrderExpired</a>: u64 = 1;
</code></pre>



<a name="deepbook_order_balance_manager_id"></a>

## Function `balance_manager_id`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): ID {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>
}
</code></pre>



</details>

<a name="deepbook_order_order_id"></a>

## Function `order_id`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u128
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u128 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>
}
</code></pre>



</details>

<a name="deepbook_order_client_order_id"></a>

## Function `client_order_id`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u64 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>
}
</code></pre>



</details>

<a name="deepbook_order_quantity"></a>

## Function `quantity`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u64 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>
}
</code></pre>



</details>

<a name="deepbook_order_filled_quantity"></a>

## Function `filled_quantity`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u64 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>
}
</code></pre>



</details>

<a name="deepbook_order_fee_is_deep"></a>

## Function `fee_is_deep`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): bool {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>
}
</code></pre>



</details>

<a name="deepbook_order_order_deep_price"></a>

## Function `order_deep_price`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): &OrderDeepPrice {
    &self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>
}
</code></pre>



</details>

<a name="deepbook_order_epoch"></a>

## Function `epoch`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u64 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>
}
</code></pre>



</details>

<a name="deepbook_order_status"></a>

## Function `status`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u8
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u8 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>
}
</code></pre>



</details>

<a name="deepbook_order_expire_timestamp"></a>

## Function `expire_timestamp`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u64 {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>
}
</code></pre>



</details>

<a name="deepbook_order_price"></a>

## Function `price`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): u64 {
    <b>let</b> (_, <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>, _) = utils::decode_order_id(self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>);
    <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>
}
</code></pre>



</details>

<a name="deepbook_order_new"></a>

## Function `new`

initialize the order struct.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_new">new</a>(<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128, <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>: bool, <a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>: <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>, <a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>: u8, <a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>: u64): <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_new">new</a>(
    <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: ID,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>: bool,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>: OrderDeepPrice,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>: u8,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>: u64,
): <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a> {
    <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a> {
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>,
    }
}
</code></pre>



</details>

<a name="deepbook_order_generate_fill"></a>

## Function `generate_fill`

Generate a fill for the resting order given the timestamp,
quantity and whether the order is a bid.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_generate_fill">generate_fill</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, timestamp: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>: bool, expire_maker: bool, taker_fee_is_deep: bool): <a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_generate_fill">generate_fill</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>,
    timestamp: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>: bool,
    expire_maker: bool,
    taker_fee_is_deep: bool,
): Fill {
    <b>let</b> remaining_quantity = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a> - self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>;
    <b>let</b> <b>mut</b> base_quantity = remaining_quantity.min(<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>);
    <b>let</b> <b>mut</b> quote_quantity = math::mul(base_quantity, self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>());
    <b>let</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>;
    <b>let</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>;
    <b>let</b> expired = timestamp &gt; self.<a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a> || expire_maker;
    <b>if</b> (expired) {
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a> = constants::expired();
        base_quantity = remaining_quantity;
        quote_quantity = math::mul(base_quantity, self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>());
    } <b>else</b> {
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a> + base_quantity;
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a> = <b>if</b> (self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a> == self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>) constants::filled()
        <b>else</b> constants::partially_filled();
    };
    fill::new(
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>(),
        <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>,
        expired,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a> == self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>,
        base_quantity,
        quote_quantity,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>,
        taker_fee_is_deep,
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>,
    )
}
</code></pre>



</details>

<a name="deepbook_order_modify"></a>

## Function `modify`

Modify the order with a new quantity. The new quantity must be greater
than the filled quantity and less than the original quantity. The
timestamp must be less than the expire timestamp.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_modify">modify</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, new_quantity: u64, timestamp: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_modify">modify</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>, new_quantity: u64, timestamp: u64) {
    <b>assert</b>!(
        new_quantity &gt; self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a> &&
        new_quantity &lt; self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_EInvalidNewQuantity">EInvalidNewQuantity</a>,
    );
    <b>assert</b>!(timestamp &lt;= self.<a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>, <a href="../../dependencies/deepbook/order.md#deepbook_order_EOrderExpired">EOrderExpired</a>);
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a> = new_quantity;
}
</code></pre>



</details>

<a name="deepbook_order_calculate_cancel_refund"></a>

## Function `calculate_cancel_refund`

Calculate the refund for a canceled order. The refund is any
unfilled quantity and the maker fee. If the cancel quantity is
not provided, the remaining quantity is used. Cancel quantity is
provided when modifying an order, so that the refund can be calculated
based on the quantity that's reduced.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_calculate_cancel_refund">calculate_cancel_refund</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, maker_fee: u64, cancel_quantity: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;u64&gt;): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_calculate_cancel_refund">calculate_cancel_refund</a>(
    self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>,
    maker_fee: u64,
    cancel_quantity: Option&lt;u64&gt;,
): Balances {
    <b>let</b> cancel_quantity = cancel_quantity.get_with_default(
        self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a> - self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>,
    );
    <b>let</b> <b>mut</b> fee_quantity = self
        .<a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>
        .fee_quantity(
            cancel_quantity,
            math::mul(cancel_quantity, self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>()),
            self.<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>(),
        );
    fee_quantity.mul(maker_fee);
    <b>let</b> <b>mut</b> base_out = 0;
    <b>let</b> <b>mut</b> quote_out = 0;
    <b>if</b> (self.<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>()) {
        quote_out = math::mul(cancel_quantity, self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>());
    } <b>else</b> {
        base_out = cancel_quantity;
    };
    <b>let</b> <b>mut</b> refund = balances::new(base_out, quote_out, 0);
    refund.add_balances(fee_quantity);
    refund
}
</code></pre>



</details>

<a name="deepbook_order_locked_balance"></a>

## Function `locked_balance`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_locked_balance">locked_balance</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, maker_fee: u64): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_locked_balance">locked_balance</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>, maker_fee: u64): Balances {
    <b>let</b> (<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>, order_price, _) = utils::decode_order_id(self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>());
    <b>let</b> <b>mut</b> base_quantity = 0;
    <b>let</b> <b>mut</b> quote_quantity = 0;
    <b>let</b> remaining_base_quantity = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>() - self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>();
    <b>let</b> remaining_quote_quantity = math::mul(
        remaining_base_quantity,
        order_price,
    );
    <b>if</b> (<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>) {
        quote_quantity = quote_quantity + remaining_quote_quantity;
    } <b>else</b> {
        base_quantity = base_quantity + remaining_base_quantity;
    };
    <b>let</b> <b>mut</b> fee_quantity = self
        .<a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>()
        .fee_quantity(
            remaining_base_quantity,
            remaining_quote_quantity,
            <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>,
        );
    fee_quantity.mul(maker_fee);
    <b>let</b> <b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_locked_balance">locked_balance</a> = balances::new(base_quantity, quote_quantity, 0);
    <a href="../../dependencies/deepbook/order.md#deepbook_order_locked_balance">locked_balance</a>.add_balances(fee_quantity);
    <a href="../../dependencies/deepbook/order.md#deepbook_order_locked_balance">locked_balance</a>
}
</code></pre>



</details>

<a name="deepbook_order_emit_order_canceled"></a>

## Function `emit_order_canceled`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_emit_order_canceled">emit_order_canceled</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, trader: <b>address</b>, timestamp: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_emit_order_canceled">emit_order_canceled</a>(
    self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>,
    pool_id: ID,
    trader: <b>address</b>,
    timestamp: u64,
) {
    <b>let</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>();
    <b>let</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>();
    <b>let</b> remaining_quantity = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a> - self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>;
    event::emit(<a href="../../dependencies/deepbook/order.md#deepbook_order_OrderCanceled">OrderCanceled</a> {
        pool_id,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>,
        trader,
        original_quantity: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>,
        base_asset_quantity_canceled: remaining_quantity,
        timestamp,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>,
    });
}
</code></pre>



</details>

<a name="deepbook_order_emit_order_modified"></a>

## Function `emit_order_modified`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_emit_order_modified">emit_order_modified</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, previous_quantity: u64, trader: <b>address</b>, timestamp: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_emit_order_modified">emit_order_modified</a>(
    self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>,
    pool_id: ID,
    previous_quantity: u64,
    trader: <b>address</b>,
    timestamp: u64,
) {
    <b>let</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>();
    <b>let</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a> = self.<a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>();
    event::emit(<a href="../../dependencies/deepbook/order.md#deepbook_order_OrderModified">OrderModified</a> {
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>,
        pool_id,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>,
        trader,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>,
        previous_quantity,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>,
        new_quantity: self.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>,
        timestamp,
    });
}
</code></pre>



</details>

<a name="deepbook_order_emit_cancel_maker"></a>

## Function `emit_cancel_maker`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_emit_cancel_maker">emit_cancel_maker</a>(<a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128, <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64, trader: <b>address</b>, <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>: u64, <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>: bool, original_quantity: u64, base_asset_quantity_canceled: u64, timestamp: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_emit_cancel_maker">emit_cancel_maker</a>(
    <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: ID,
    pool_id: ID,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: u128,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: u64,
    trader: <b>address</b>,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>: u64,
    <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>: bool,
    original_quantity: u64,
    base_asset_quantity_canceled: u64,
    timestamp: u64,
) {
    event::emit(<a href="../../dependencies/deepbook/order.md#deepbook_order_OrderCanceled">OrderCanceled</a> {
        <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>,
        pool_id,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>,
        trader,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_price">price</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>,
        original_quantity,
        base_asset_quantity_canceled,
        timestamp,
    });
}
</code></pre>



</details>

<a name="deepbook_order_copy_order"></a>

## Function `copy_order`

Copy the order struct.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_copy_order">copy_order</a>(order: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_copy_order">copy_order</a>(order: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a> {
    <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a> {
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_balance_manager_id">balance_manager_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_client_order_id">client_order_id</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_quantity">quantity</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_filled_quantity">filled_quantity</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_fee_is_deep">fee_is_deep</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_deep_price">order_deep_price</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_epoch">epoch</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a>,
        <a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>: order.<a href="../../dependencies/deepbook/order.md#deepbook_order_expire_timestamp">expire_timestamp</a>,
    }
}
</code></pre>



</details>

<a name="deepbook_order_set_canceled"></a>

## Function `set_canceled`

Update the order status to canceled.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_set_canceled">set_canceled</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_set_canceled">set_canceled</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>) {
    self.<a href="../../dependencies/deepbook/order.md#deepbook_order_status">status</a> = constants::canceled();
}
</code></pre>



</details>

<a name="deepbook_order_is_bid"></a>

## Function `is_bid`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>(self: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">Order</a>): bool {
    <b>let</b> (<a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>, _, _) = utils::decode_order_id(self.<a href="../../dependencies/deepbook/order.md#deepbook_order_order_id">order_id</a>);
    <a href="../../dependencies/deepbook/order.md#deepbook_order_is_bid">is_bid</a>
}
</code></pre>



</details>
