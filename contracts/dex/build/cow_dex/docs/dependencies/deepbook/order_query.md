
<a name="deepbook_order_query"></a>

# Module `deepbook::order_query`

This module defines the OrderPage struct and its methods to iterate over orders in a pool.


-  [Struct `OrderPage`](#deepbook_order_query_OrderPage)
-  [Function `iter_orders`](#deepbook_order_query_iter_orders)
-  [Function `orders`](#deepbook_order_query_orders)
-  [Function `has_next_page`](#deepbook_order_query_has_next_page)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/account.md#deepbook_account">deepbook::account</a>;
<b>use</b> <a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager">deepbook::balance_manager</a>;
<b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/big_vector.md#deepbook_big_vector">deepbook::big_vector</a>;
<b>use</b> <a href="../../dependencies/deepbook/book.md#deepbook_book">deepbook::book</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price">deepbook::deep_price</a>;
<b>use</b> <a href="../../dependencies/deepbook/ewma.md#deepbook_ewma">deepbook::ewma</a>;
<b>use</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill">deepbook::fill</a>;
<b>use</b> <a href="../../dependencies/deepbook/governance.md#deepbook_governance">deepbook::governance</a>;
<b>use</b> <a href="../../dependencies/deepbook/history.md#deepbook_history">deepbook::history</a>;
<b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/deepbook/order.md#deepbook_order">deepbook::order</a>;
<b>use</b> <a href="../../dependencies/deepbook/order_info.md#deepbook_order_info">deepbook::order_info</a>;
<b>use</b> <a href="../../dependencies/deepbook/pool.md#deepbook_pool">deepbook::pool</a>;
<b>use</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry">deepbook::registry</a>;
<b>use</b> <a href="../../dependencies/deepbook/state.md#deepbook_state">deepbook::state</a>;
<b>use</b> <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params">deepbook::trade_params</a>;
<b>use</b> <a href="../../dependencies/deepbook/utils.md#deepbook_utils">deepbook::utils</a>;
<b>use</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault">deepbook::vault</a>;
<b>use</b> <a href="../../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../../dependencies/std/internal.md#std_internal">std::internal</a>;
<b>use</b> <a href="../../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../../dependencies/std/u64.md#std_u64">std::u64</a>;
<b>use</b> <a href="../../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../../dependencies/sui/bag.md#sui_bag">sui::bag</a>;
<b>use</b> <a href="../../dependencies/sui/balance.md#sui_balance">sui::balance</a>;
<b>use</b> <a href="../../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../../dependencies/sui/clock.md#sui_clock">sui::clock</a>;
<b>use</b> <a href="../../dependencies/sui/coin.md#sui_coin">sui::coin</a>;
<b>use</b> <a href="../../dependencies/sui/config.md#sui_config">sui::config</a>;
<b>use</b> <a href="../../dependencies/sui/deny_list.md#sui_deny_list">sui::deny_list</a>;
<b>use</b> <a href="../../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../../dependencies/sui/dynamic_object_field.md#sui_dynamic_object_field">sui::dynamic_object_field</a>;
<b>use</b> <a href="../../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../../dependencies/sui/funds_accumulator.md#sui_funds_accumulator">sui::funds_accumulator</a>;
<b>use</b> <a href="../../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../../dependencies/sui/protocol_config.md#sui_protocol_config">sui::protocol_config</a>;
<b>use</b> <a href="../../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../../dependencies/sui/types.md#sui_types">sui::types</a>;
<b>use</b> <a href="../../dependencies/sui/url.md#sui_url">sui::url</a>;
<b>use</b> <a href="../../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
<b>use</b> <a href="../../dependencies/sui/versioned.md#sui_versioned">sui::versioned</a>;
<b>use</b> token::deep;
</code></pre>



<a name="deepbook_order_query_OrderPage"></a>

## Struct `OrderPage`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">OrderPage</a> <b>has</b> drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>: vector&lt;<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_has_next_page">has_next_page</a>: bool</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_order_query_iter_orders"></a>

## Function `iter_orders`

Bid minimum order id has 0 for its first bit, 0 for next 63 bits for price, and 1 for next 64 bits for order id.
Ask minimum order id has 1 for its first bit, 0 for next 63 bits for price, and 0 for next 64 bits for order id.
Bids are iterated from high to low order id, and asks are iterated from low to high order id.


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_iter_orders">iter_orders</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<a href="../../dependencies/deepbook/pool.md#deepbook_pool_Pool">deepbook::pool::Pool</a>&lt;BaseAsset, QuoteAsset&gt;, start_order_id: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;u128&gt;, end_order_id: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;u128&gt;, min_expire_timestamp: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;u64&gt;, limit: u64, bids: bool): <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">deepbook::order_query::OrderPage</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_iter_orders">iter_orders</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &Pool&lt;BaseAsset, QuoteAsset&gt;,
    start_order_id: Option&lt;u128&gt;,
    end_order_id: Option&lt;u128&gt;,
    min_expire_timestamp: Option&lt;u64&gt;,
    limit: u64,
    bids: bool,
): <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">OrderPage</a> {
    <b>let</b> self = self.load_inner();
    <b>let</b> bid_min_order_id = 0;
    <b>let</b> bid_max_order_id = 1u128 &lt;&lt; 127;
    <b>let</b> ask_min_order_id = 1u128 &lt;&lt; 127;
    <b>let</b> ask_max_order_id = constants::max_u128();
    <b>let</b> start = start_order_id.get_with_default({
        <b>if</b> (bids) bid_max_order_id <b>else</b> ask_min_order_id
    });
    <b>let</b> end = end_order_id.get_with_default({
        <b>if</b> (bids) bid_min_order_id <b>else</b> ask_max_order_id
    });
    <b>let</b> min_expire = min_expire_timestamp.get_with_default(0);
    <b>let</b> side = <b>if</b> (bids) self.bids() <b>else</b> self.asks();
    <b>let</b> <b>mut</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a> = vector[];
    <b>let</b> (<b>mut</b> ref, <b>mut</b> offset) = <b>if</b> (bids) {
        side.slice_before(start)
    } <b>else</b> {
        side.slice_following(start)
    };
    <b>while</b> (!ref.is_null() && <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>.length() &lt; limit) {
        <b>let</b> order = slice_borrow(side.borrow_slice(ref), offset);
        <b>if</b> (bids && order.order_id() &lt; end) <b>break</b>;
        <b>if</b> (!bids && order.order_id() &gt; end) <b>break</b>;
        <b>if</b> (order.expire_timestamp() &gt;= min_expire) {
            <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>.push_back(order.copy_order());
        };
        (ref, offset) = <b>if</b> (bids) side.prev_slice(ref, offset) <b>else</b> side.next_slice(ref, offset);
    };
    <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">OrderPage</a> {
        <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>: <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>,
        <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_has_next_page">has_next_page</a>: !ref.is_null(),
    }
}
</code></pre>



</details>

<a name="deepbook_order_query_orders"></a>

## Function `orders`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>(self: &<a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">deepbook::order_query::OrderPage</a>): &vector&lt;<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>(self: &<a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">OrderPage</a>): &vector&lt;Order&gt; {
    &self.<a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_orders">orders</a>
}
</code></pre>



</details>

<a name="deepbook_order_query_has_next_page"></a>

## Function `has_next_page`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_has_next_page">has_next_page</a>(self: &<a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">deepbook::order_query::OrderPage</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_has_next_page">has_next_page</a>(self: &<a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_OrderPage">OrderPage</a>): bool {
    self.<a href="../../dependencies/deepbook/order_query.md#deepbook_order_query_has_next_page">has_next_page</a>
}
</code></pre>



</details>
