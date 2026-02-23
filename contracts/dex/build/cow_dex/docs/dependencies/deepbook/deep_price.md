
<a name="deepbook_deep_price"></a>

# Module `deepbook::deep_price`

DEEP price module. This module maintains the conversion rate
between DEEP and the base and quote assets.


-  [Struct `Price`](#deepbook_deep_price_Price)
-  [Struct `PriceAdded`](#deepbook_deep_price_PriceAdded)
-  [Struct `DeepPrice`](#deepbook_deep_price_DeepPrice)
-  [Struct `OrderDeepPrice`](#deepbook_deep_price_OrderDeepPrice)
-  [Constants](#@Constants_0)
-  [Function `asset_is_base`](#deepbook_deep_price_asset_is_base)
-  [Function `deep_per_asset`](#deepbook_deep_price_deep_per_asset)
-  [Function `empty`](#deepbook_deep_price_empty)
-  [Function `new_order_deep_price`](#deepbook_deep_price_new_order_deep_price)
-  [Function `get_order_deep_price`](#deepbook_deep_price_get_order_deep_price)
-  [Function `empty_deep_price`](#deepbook_deep_price_empty_deep_price)
-  [Function `fee_quantity`](#deepbook_deep_price_fee_quantity)
-  [Function `deep_quantity_u128`](#deepbook_deep_price_deep_quantity_u128)
-  [Function `add_price_point`](#deepbook_deep_price_add_price_point)
-  [Function `emit_deep_price_added`](#deepbook_deep_price_emit_deep_price_added)
-  [Function `calculate_order_deep_price`](#deepbook_deep_price_calculate_order_deep_price)
-  [Function `last_insert_timestamp`](#deepbook_deep_price_last_insert_timestamp)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
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



<a name="deepbook_deep_price_Price"></a>

## Struct `Price`

DEEP price point.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_Price">Price</a> <b>has</b> drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>conversion_rate: u64</code>
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

<a name="deepbook_deep_price_PriceAdded"></a>

## Struct `PriceAdded`

DEEP price point added event.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_PriceAdded">PriceAdded</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>conversion_rate: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>timestamp: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>is_base_conversion: bool</code>
</dt>
<dd>
</dd>
<dt>
<code>reference_pool: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>target_pool: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_deep_price_DeepPrice"></a>

## Struct `DeepPrice`

DEEP price points used for trading fee calculations.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a> <b>has</b> drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>base_prices: vector&lt;<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_Price">deepbook::deep_price::Price</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>cumulative_base: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>quote_prices: vector&lt;<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_Price">deepbook::deep_price::Price</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>cumulative_quote: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_deep_price_OrderDeepPrice"></a>

## Struct `OrderDeepPrice`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>: bool</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="deepbook_deep_price_EDataPointRecentlyAdded"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_EDataPointRecentlyAdded">EDataPointRecentlyAdded</a>: u64 = 1;
</code></pre>



<a name="deepbook_deep_price_ENoDataPoints"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_ENoDataPoints">ENoDataPoints</a>: u64 = 2;
</code></pre>



<a name="deepbook_deep_price_MIN_DURATION_BETWEEN_DATA_POINTS_MS"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MIN_DURATION_BETWEEN_DATA_POINTS_MS">MIN_DURATION_BETWEEN_DATA_POINTS_MS</a>: u64 = 60000;
</code></pre>



<a name="deepbook_deep_price_MAX_DATA_POINT_AGE_MS"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MAX_DATA_POINT_AGE_MS">MAX_DATA_POINT_AGE_MS</a>: u64 = 86400000;
</code></pre>



<a name="deepbook_deep_price_MAX_DATA_POINTS"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MAX_DATA_POINTS">MAX_DATA_POINTS</a>: u64 = 100;
</code></pre>



<a name="deepbook_deep_price_asset_is_base"></a>

## Function `asset_is_base`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a>): bool {
    self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>
}
</code></pre>



</details>

<a name="deepbook_deep_price_deep_per_asset"></a>

## Function `deep_per_asset`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a>): u64 {
    self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>
}
</code></pre>



</details>

<a name="deepbook_deep_price_empty"></a>

## Function `empty`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_empty">empty</a>(): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">deepbook::deep_price::DeepPrice</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_empty">empty</a>(): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a> {
    <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a> {
        base_prices: vector[],
        cumulative_base: 0,
        quote_prices: vector[],
        cumulative_quote: 0,
    }
}
</code></pre>



</details>

<a name="deepbook_deep_price_new_order_deep_price"></a>

## Function `new_order_deep_price`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_new_order_deep_price">new_order_deep_price</a>(<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>: bool, <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>: u64): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_new_order_deep_price">new_order_deep_price</a>(<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>: bool, <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>: u64): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a> {
    <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a> {
        <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>: <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>,
        <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>: <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>,
    }
}
</code></pre>



</details>

<a name="deepbook_deep_price_get_order_deep_price"></a>

## Function `get_order_deep_price`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_get_order_deep_price">get_order_deep_price</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">deepbook::deep_price::DeepPrice</a>, whitelisted: bool): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_get_order_deep_price">get_order_deep_price</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a>, whitelisted: bool): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a> {
    <b>let</b> (<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>, <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>) = self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_calculate_order_deep_price">calculate_order_deep_price</a>(
        whitelisted,
    );
    <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_new_order_deep_price">new_order_deep_price</a>(<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>, <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>)
}
</code></pre>



</details>

<a name="deepbook_deep_price_empty_deep_price"></a>

## Function `empty_deep_price`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_empty_deep_price">empty_deep_price</a>(_self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">deepbook::deep_price::DeepPrice</a>): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_empty_deep_price">empty_deep_price</a>(_self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a>): <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a> {
    <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_new_order_deep_price">new_order_deep_price</a>(<b>false</b>, 0)
}
</code></pre>



</details>

<a name="deepbook_deep_price_fee_quantity"></a>

## Function `fee_quantity`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_fee_quantity">fee_quantity</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>, base_quantity: u64, quote_quantity: u64, is_bid: bool): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_fee_quantity">fee_quantity</a>(
    self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a>,
    base_quantity: u64,
    quote_quantity: u64,
    is_bid: bool,
): Balances {
    <b>let</b> deep_quantity = <b>if</b> (self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>) {
        math::mul(base_quantity, self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>)
    } <b>else</b> {
        math::mul(quote_quantity, self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>)
    };
    <b>if</b> (self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a> &gt; 0) {
        balances::new(0, 0, deep_quantity)
    } <b>else</b> <b>if</b> (is_bid) {
        balances::new(
            0,
            math::mul(
                quote_quantity,
                constants::fee_penalty_multiplier(),
            ),
            0,
        )
    } <b>else</b> {
        balances::new(
            math::mul(base_quantity, constants::fee_penalty_multiplier()),
            0,
            0,
        )
    }
}
</code></pre>



</details>

<a name="deepbook_deep_price_deep_quantity_u128"></a>

## Function `deep_quantity_u128`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_quantity_u128">deep_quantity_u128</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">deepbook::deep_price::OrderDeepPrice</a>, base_quantity: u128, quote_quantity: u128): u128
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_quantity_u128">deep_quantity_u128</a>(
    self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_OrderDeepPrice">OrderDeepPrice</a>,
    base_quantity: u128,
    quote_quantity: u128,
): u128 {
    <b>if</b> (self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_asset_is_base">asset_is_base</a>) {
        math::mul_u128(base_quantity, self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a> <b>as</b> u128)
    } <b>else</b> {
        math::mul_u128(quote_quantity, self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a> <b>as</b> u128)
    }
}
</code></pre>



</details>

<a name="deepbook_deep_price_add_price_point"></a>

## Function `add_price_point`

Add a price point. If max data points are reached, the oldest data point is removed.
Remove all data points older than MAX_DATA_POINT_AGE_MS.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_add_price_point">add_price_point</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">deepbook::deep_price::DeepPrice</a>, conversion_rate: u64, timestamp: u64, is_base_conversion: bool)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_add_price_point">add_price_point</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a>,
    conversion_rate: u64,
    timestamp: u64,
    is_base_conversion: bool,
) {
    <b>assert</b>!(
        self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_last_insert_timestamp">last_insert_timestamp</a>(is_base_conversion) +
        <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MIN_DURATION_BETWEEN_DATA_POINTS_MS">MIN_DURATION_BETWEEN_DATA_POINTS_MS</a> &lt;
        timestamp,
        <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_EDataPointRecentlyAdded">EDataPointRecentlyAdded</a>,
    );
    <b>let</b> asset_prices = <b>if</b> (is_base_conversion) {
        &<b>mut</b> self.base_prices
    } <b>else</b> {
        &<b>mut</b> self.quote_prices
    };
    asset_prices.push_back(<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_Price">Price</a> {
        timestamp: timestamp,
        conversion_rate: conversion_rate,
    });
    <b>if</b> (is_base_conversion) {
        self.cumulative_base = self.cumulative_base + conversion_rate;
        <b>while</b> (
            asset_prices.length() == <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MAX_DATA_POINTS">MAX_DATA_POINTS</a> + 1 ||
            asset_prices[0].timestamp + <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MAX_DATA_POINT_AGE_MS">MAX_DATA_POINT_AGE_MS</a> &lt; timestamp
        ) {
            self.cumulative_base = self.cumulative_base - asset_prices[0].conversion_rate;
            asset_prices.remove(0);
        }
    } <b>else</b> {
        self.cumulative_quote = self.cumulative_quote + conversion_rate;
        <b>while</b> (
            asset_prices.length() == <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MAX_DATA_POINTS">MAX_DATA_POINTS</a> + 1 ||
            asset_prices[0].timestamp + <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_MAX_DATA_POINT_AGE_MS">MAX_DATA_POINT_AGE_MS</a> &lt; timestamp
        ) {
            self.cumulative_quote = self.cumulative_quote - asset_prices[0].conversion_rate;
            asset_prices.remove(0);
        }
    };
}
</code></pre>



</details>

<a name="deepbook_deep_price_emit_deep_price_added"></a>

## Function `emit_deep_price_added`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_emit_deep_price_added">emit_deep_price_added</a>(conversion_rate: u64, timestamp: u64, is_base_conversion: bool, reference_pool: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, target_pool: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_emit_deep_price_added">emit_deep_price_added</a>(
    conversion_rate: u64,
    timestamp: u64,
    is_base_conversion: bool,
    reference_pool: ID,
    target_pool: ID,
) {
    event::emit(<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_PriceAdded">PriceAdded</a> {
        conversion_rate,
        timestamp,
        is_base_conversion,
        reference_pool,
        target_pool,
    });
}
</code></pre>



</details>

<a name="deepbook_deep_price_calculate_order_deep_price"></a>

## Function `calculate_order_deep_price`

Returns the conversion rate of DEEP per asset token.
Quote will be used by default, if there are no quote data then base will be used


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_calculate_order_deep_price">calculate_order_deep_price</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">deepbook::deep_price::DeepPrice</a>, whitelisted: bool): (bool, u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_calculate_order_deep_price">calculate_order_deep_price</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a>, whitelisted: bool): (bool, u64) {
    <b>if</b> (whitelisted) {
        <b>return</b> (<b>false</b>, 0) // no fees <b>for</b> whitelist
    };
    <b>assert</b>!(
        self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_last_insert_timestamp">last_insert_timestamp</a>(<b>true</b>) &gt; 0 ||
        self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_last_insert_timestamp">last_insert_timestamp</a>(<b>false</b>) &gt; 0,
        <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_ENoDataPoints">ENoDataPoints</a>,
    );
    <b>let</b> is_base_conversion = self.<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_last_insert_timestamp">last_insert_timestamp</a>(<b>false</b>) == 0;
    <b>let</b> cumulative_asset = <b>if</b> (is_base_conversion) {
        self.cumulative_base
    } <b>else</b> {
        self.cumulative_quote
    };
    <b>let</b> asset_length = <b>if</b> (is_base_conversion) {
        self.base_prices.length()
    } <b>else</b> {
        self.quote_prices.length()
    };
    <b>let</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a> = cumulative_asset / asset_length;
    (is_base_conversion, <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_deep_per_asset">deep_per_asset</a>)
}
</code></pre>



</details>

<a name="deepbook_deep_price_last_insert_timestamp"></a>

## Function `last_insert_timestamp`



<pre><code><b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_last_insert_timestamp">last_insert_timestamp</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">deepbook::deep_price::DeepPrice</a>, is_base_conversion: bool): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_last_insert_timestamp">last_insert_timestamp</a>(self: &<a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price_DeepPrice">DeepPrice</a>, is_base_conversion: bool): u64 {
    <b>let</b> prices = <b>if</b> (is_base_conversion) {
        &self.base_prices
    } <b>else</b> {
        &self.quote_prices
    };
    <b>if</b> (prices.length() &gt; 0) {
        prices[prices.length() - 1].timestamp
    } <b>else</b> {
        0
    }
}
</code></pre>



</details>
