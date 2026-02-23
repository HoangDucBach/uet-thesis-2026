
<a name="cow_dex_intent_book"></a>

# Module `cow_dex::intent_book`



-  [Struct `IntentCreatedEvent`](#cow_dex_intent_book_IntentCreatedEvent)
-  [Struct `IntentCancelledEvent`](#cow_dex_intent_book_IntentCancelledEvent)
-  [Struct `Intent`](#cow_dex_intent_book_Intent)
-  [Struct `IntentCap`](#cow_dex_intent_book_IntentCap)
-  [Constants](#@Constants_0)
-  [Function `create_intent`](#cow_dex_intent_book_create_intent)
-  [Function `cancel_intent`](#cow_dex_intent_book_cancel_intent)
-  [Function `consume_intent`](#cow_dex_intent_book_consume_intent)
-  [Function `owner`](#cow_dex_intent_book_owner)
-  [Function `sell_amount`](#cow_dex_intent_book_sell_amount)
-  [Function `min_amount_out`](#cow_dex_intent_book_min_amount_out)
-  [Function `deadline`](#cow_dex_intent_book_deadline)
-  [Function `batch_id`](#cow_dex_intent_book_batch_id)


<pre><code><b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/internal.md#std_internal">std::internal</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/bag.md#sui_bag">sui::bag</a>;
<b>use</b> <a href="../dependencies/sui/balance.md#sui_balance">sui::balance</a>;
<b>use</b> <a href="../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../dependencies/sui/clock.md#sui_clock">sui::clock</a>;
<b>use</b> <a href="../dependencies/sui/coin.md#sui_coin">sui::coin</a>;
<b>use</b> <a href="../dependencies/sui/config.md#sui_config">sui::config</a>;
<b>use</b> <a href="../dependencies/sui/deny_list.md#sui_deny_list">sui::deny_list</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_object_field.md#sui_dynamic_object_field">sui::dynamic_object_field</a>;
<b>use</b> <a href="../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../dependencies/sui/funds_accumulator.md#sui_funds_accumulator">sui::funds_accumulator</a>;
<b>use</b> <a href="../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../dependencies/sui/protocol_config.md#sui_protocol_config">sui::protocol_config</a>;
<b>use</b> <a href="../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/types.md#sui_types">sui::types</a>;
<b>use</b> <a href="../dependencies/sui/url.md#sui_url">sui::url</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
</code></pre>



<a name="cow_dex_intent_book_IntentCreatedEvent"></a>

## Struct `IntentCreatedEvent`

Emitted when user creates a new intent.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCreatedEvent">IntentCreatedEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>intent_id: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_intent_book_IntentCancelledEvent"></a>

## Struct `IntentCancelledEvent`

Emitted when user cancels an intent.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCancelledEvent">IntentCancelledEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>intent_id: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_intent_book_Intent"></a>

## Struct `Intent`

Shared object — user's coins locked inside until settlement or cancellation.

* <code>id</code>: Shared object ID.
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">batch_id</a></code>: Optional — set when assigned to a batch.
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a></code>: User address.
* <code>sell_balance</code>: Locked coins of type SellCoin.
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a></code>: Amount to sell.
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a></code>: User's minimum acceptable output.
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a></code>: Unix milliseconds — intent expires after this.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;<b>phantom</b> SellCoin, <b>phantom</b> BuyCoin&gt; <b>has</b> key
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
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">batch_id</a>: <a href="../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;u64&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>sell_balance: <a href="../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;SellCoin&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_intent_book_IntentCap"></a>

## Struct `IntentCap`

Owned capability — user holds this to prove ownership and cancel intent.

* <code>id</code>: Capability ID.
* <code>intent_id</code>: ID of the Intent this cap controls.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">IntentCap</a> <b>has</b> key, store
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
<code>intent_id: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="cow_dex_intent_book_EDeadlineInPast"></a>



<pre><code><b>const</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_EDeadlineInPast">EDeadlineInPast</a>: u64 = 0;
</code></pre>



<a name="cow_dex_intent_book_ENotIntentOwner"></a>



<pre><code><b>const</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_ENotIntentOwner">ENotIntentOwner</a>: u64 = 1;
</code></pre>



<a name="cow_dex_intent_book_create_intent"></a>

## Function `create_intent`

User creates a new intent, locking coins in a shared object.

* <code>coin</code>: User's coin to trade (type SellCoin).
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a></code>: Minimum acceptable output (in BuyCoin).
* <code><a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a></code>: Unix milliseconds deadline.
* <code>clock</code>: Sui clock for deadline validation.
* <code>ctx</code>: Transaction context.

Type Parameters:
* <code>SellCoin</code>: Coin type user is selling.
* <code>BuyCoin</code>: Coin type user wants to receive.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_create_intent">create_intent</a>&lt;SellCoin, BuyCoin&gt;(coin: <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;SellCoin&gt;, <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>: u64, <a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>: u64, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">cow_dex::intent_book::IntentCap</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_create_intent">create_intent</a>&lt;SellCoin, BuyCoin&gt;(
    coin: Coin&lt;SellCoin&gt;,
    <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>: u64,
    <a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>: u64,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
): <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">IntentCap</a> {
    <b>let</b> current_time_ms = clock.timestamp_ms();
    <b>assert</b>!(<a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a> &gt; current_time_ms, <a href="../cow_dex/intent_book.md#cow_dex_intent_book_EDeadlineInPast">EDeadlineInPast</a>);
    <b>let</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a> = coin::value(&coin);
    <b>let</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a> = ctx.sender();
    <b>let</b> sell_balance = coin::into_balance(coin);
    <b>let</b> intent = <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt; {
        id: object::new(ctx),
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">batch_id</a>: <a href="../dependencies/std/option.md#std_option_none">std::option::none</a>(),
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>,
        sell_balance,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>,
    };
    <b>let</b> intent_id = object::id(&intent);
    <b>let</b> cap = <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">IntentCap</a> {
        id: object::new(ctx),
        intent_id,
    };
    // Share the intent object
    transfer::share_object(intent);
    emit(<a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCreatedEvent">IntentCreatedEvent</a> {
        intent_id,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>,
    });
    cap
}
</code></pre>



</details>

<a name="cow_dex_intent_book_cancel_intent"></a>

## Function `cancel_intent`

User cancels their intent, retrieving coins.

* <code>cap</code>: IntentCap.
* <code>intent</code>: Intent object.
* <code>ctx</code>: Transaction context.

Type Parameters:
* <code>SellCoin</code>: Coin type user is selling.
* <code>BuyCoin</code>: Coin type user wanted to receive.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_cancel_intent">cancel_intent</a>&lt;SellCoin, BuyCoin&gt;(cap: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">cow_dex::intent_book::IntentCap</a>, intent: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_cancel_intent">cancel_intent</a>&lt;SellCoin, BuyCoin&gt;(
    cap: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">IntentCap</a>,
    intent: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;,
    ctx: &<b>mut</b> TxContext,
) {
    <b>let</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCap">IntentCap</a> { id: cap_id, intent_id } = cap;
    <b>let</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt; { id, <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>, sell_balance, <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>, .. } = intent;
    object::delete(cap_id);
    object::delete(id);
    <b>assert</b>!(<a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a> == ctx.sender(), <a href="../cow_dex/intent_book.md#cow_dex_intent_book_ENotIntentOwner">ENotIntentOwner</a>);
    // Return coins to user
    transfer::public_transfer(
        coin::from_balance(sell_balance, ctx),
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>,
    );
    emit(<a href="../cow_dex/intent_book.md#cow_dex_intent_book_IntentCancelledEvent">IntentCancelledEvent</a> {
        intent_id,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>,
    });
}
</code></pre>



</details>

<a name="cow_dex_intent_book_consume_intent"></a>

## Function `consume_intent`

Consume intent during settlement.
Intent taken by value and deleted — prevents replay.
Sui linear type system guarantees deletion is irreversible.

* <code>intent</code>: Intent taken by value (deleted atomically).
Returns: (owner address, sell_balance, min_amount_out)

Type Parameters:
* <code>SellCoin</code>: Coin type user was selling.
* <code>BuyCoin</code>: Coin type user wanted to receive.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_consume_intent">consume_intent</a>&lt;SellCoin, BuyCoin&gt;(intent: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;): (<b>address</b>, <a href="../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;SellCoin&gt;, u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_consume_intent">consume_intent</a>&lt;SellCoin, BuyCoin&gt;(
    intent: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;,
): (<b>address</b>, Balance&lt;SellCoin&gt;, u64) {
    <b>let</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt; {
        id,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>,
        sell_balance,
        <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>,
        ..,
    } = intent;
    object::delete(id); // shared object deleted — replay impossible
    (<a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>, sell_balance, <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>)
}
</code></pre>



</details>

<a name="cow_dex_intent_book_owner"></a>

## Function `owner`

Get intent owner.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;): <b>address</b>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;): <b>address</b> {
    intent.<a href="../cow_dex/intent_book.md#cow_dex_intent_book_owner">owner</a>
}
</code></pre>



</details>

<a name="cow_dex_intent_book_sell_amount"></a>

## Function `sell_amount`

Get sell amount.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;): u64 {
    intent.<a href="../cow_dex/intent_book.md#cow_dex_intent_book_sell_amount">sell_amount</a>
}
</code></pre>



</details>

<a name="cow_dex_intent_book_min_amount_out"></a>

## Function `min_amount_out`

Get minimum output required (in BuyCoin).


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;): u64 {
    intent.<a href="../cow_dex/intent_book.md#cow_dex_intent_book_min_amount_out">min_amount_out</a>
}
</code></pre>



</details>

<a name="cow_dex_intent_book_deadline"></a>

## Function `deadline`

Get deadline in milliseconds.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;): u64 {
    intent.<a href="../cow_dex/intent_book.md#cow_dex_intent_book_deadline">deadline</a>
}
</code></pre>



</details>

<a name="cow_dex_intent_book_batch_id"></a>

## Function `batch_id`

Get batch ID if assigned.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">batch_id</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;): <a href="../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;u64&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">batch_id</a>&lt;SellCoin, BuyCoin&gt;(intent: &<a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">Intent</a>&lt;SellCoin, BuyCoin&gt;): Option&lt;u64&gt; {
    intent.<a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">batch_id</a>
}
</code></pre>



</details>
