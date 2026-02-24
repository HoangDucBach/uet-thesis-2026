
<a name="token_deep"></a>

# Module `token::deep`



-  [Struct `DEEP`](#token_deep_DEEP)
-  [Struct `ProtectedTreasury`](#token_deep_ProtectedTreasury)
-  [Struct `TreasuryCapKey`](#token_deep_TreasuryCapKey)
-  [Function `burn`](#token_deep_burn)
-  [Function `total_supply`](#token_deep_total_supply)
-  [Function `borrow_cap`](#token_deep_borrow_cap)
-  [Function `borrow_cap_mut`](#token_deep_borrow_cap_mut)
-  [Function `create_coin`](#token_deep_create_coin)
-  [Function `init`](#token_deep_init)


<pre><code><b>use</b> <a href="../../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../../dependencies/std/internal.md#std_internal">std::internal</a>;
<b>use</b> <a href="../../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../../dependencies/sui/bag.md#sui_bag">sui::bag</a>;
<b>use</b> <a href="../../dependencies/sui/balance.md#sui_balance">sui::balance</a>;
<b>use</b> <a href="../../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
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
</code></pre>



<a name="token_deep_DEEP"></a>

## Struct `DEEP`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a> <b>has</b> drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="token_deep_ProtectedTreasury"></a>

## Struct `ProtectedTreasury`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a> <b>has</b> key
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

<a name="token_deep_TreasuryCapKey"></a>

## Struct `TreasuryCapKey`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="token_deep_burn"></a>

## Function `burn`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_burn">burn</a>(arg0: &<b>mut</b> token::deep::ProtectedTreasury, arg1: <a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;token::deep::DEEP&gt;)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_burn">burn</a>(arg0: &<b>mut</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a>, arg1: <a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;) {
    <a href="../../dependencies/sui/coin.md#sui_coin_burn">sui::coin::burn</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;(<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_borrow_cap_mut">borrow_cap_mut</a>(arg0), arg1);
}
</code></pre>



</details>

<a name="token_deep_total_supply"></a>

## Function `total_supply`



<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_total_supply">total_supply</a>(arg0: &token::deep::ProtectedTreasury): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_total_supply">total_supply</a>(arg0: &<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a>): u64 {
    <a href="../../dependencies/sui/coin.md#sui_coin_total_supply">sui::coin::total_supply</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;(<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_borrow_cap">borrow_cap</a>(arg0))
}
</code></pre>



</details>

<a name="token_deep_borrow_cap"></a>

## Function `borrow_cap`



<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_borrow_cap">borrow_cap</a>(arg0: &token::deep::ProtectedTreasury): &<a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;token::deep::DEEP&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_borrow_cap">borrow_cap</a>(arg0: &<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a>): &<a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt; {
    <b>let</b> v0 = <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a> {};
    <a href="../../dependencies/sui/dynamic_object_field.md#sui_dynamic_object_field_borrow">sui::dynamic_object_field::borrow</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a>, <a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;&gt;(
        &arg0.id,
        v0,
    )
}
</code></pre>



</details>

<a name="token_deep_borrow_cap_mut"></a>

## Function `borrow_cap_mut`



<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_borrow_cap_mut">borrow_cap_mut</a>(arg0: &<b>mut</b> token::deep::ProtectedTreasury): &<b>mut</b> <a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;token::deep::DEEP&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_borrow_cap_mut">borrow_cap_mut</a>(arg0: &<b>mut</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a>): &<b>mut</b> <a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt; {
    <b>let</b> v0 = <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a> {};
    <a href="../../dependencies/sui/dynamic_object_field.md#sui_dynamic_object_field_borrow_mut">sui::dynamic_object_field::borrow_mut</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a>, <a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;&gt;(
        &<b>mut</b> arg0.id,
        v0,
    )
}
</code></pre>



</details>

<a name="token_deep_create_coin"></a>

## Function `create_coin`



<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_create_coin">create_coin</a>(arg0: token::deep::DEEP, arg1: u64, arg2: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (token::deep::ProtectedTreasury, <a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;token::deep::DEEP&gt;)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_create_coin">create_coin</a>(
    arg0: <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>,
    arg1: u64,
    arg2: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>,
): (<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a>, <a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;) {
    <b>let</b> (v0, v1) = <a href="../../dependencies/sui/coin.md#sui_coin_create_currency">sui::coin::create_currency</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;(
        arg0,
        6,
        b"<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>",
        b"DeepBook Token",
        b"The <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a> token secures the DeepBook protocol, the premier wholesale liquidity venue <b>for</b> on-chain trading.",
        <a href="../../dependencies/std/option.md#std_option_some">std::option::some</a>&lt;<a href="../../dependencies/sui/url.md#sui_url_Url">sui::url::Url</a>&gt;(
            <a href="../../dependencies/sui/url.md#sui_url_new_unsafe_from_bytes">sui::url::new_unsafe_from_bytes</a>(b"https://images.deepbook.tech/icon.svg"),
        ),
        arg2,
    );
    <b>let</b> <b>mut</b> cap = v0;
    <a href="../../dependencies/sui/transfer.md#sui_transfer_public_freeze_object">sui::transfer::public_freeze_object</a>&lt;<a href="../../dependencies/sui/coin.md#sui_coin_CoinMetadata">sui::coin::CoinMetadata</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;&gt;(v1);
    <b>let</b> <b>mut</b> protected_treasury = <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a> { id: <a href="../../dependencies/sui/object.md#sui_object_new">sui::object::new</a>(arg2) };
    <b>let</b> coin = <a href="../../dependencies/sui/coin.md#sui_coin_mint">sui::coin::mint</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;(&<b>mut</b> cap, arg1, arg2);
    <a href="../../dependencies/sui/dynamic_object_field.md#sui_dynamic_object_field_add">sui::dynamic_object_field::add</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a>, <a href="../../dependencies/sui/coin.md#sui_coin_TreasuryCap">sui::coin::TreasuryCap</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;&gt;(
        &<b>mut</b> protected_treasury.id,
        <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_TreasuryCapKey">TreasuryCapKey</a> {},
        cap,
    );
    (protected_treasury, coin)
}
</code></pre>



</details>

<a name="token_deep_init"></a>

## Function `init`



<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_init">init</a>(arg0: token::deep::DEEP, arg1: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_init">init</a>(arg0: <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>, arg1: &<b>mut</b> TxContext) {
    <b>let</b> (v0, v1) = <a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_create_coin">create_coin</a>(arg0, 10000000000000000, arg1);
    <a href="../../dependencies/sui/transfer.md#sui_transfer_share_object">sui::transfer::share_object</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_ProtectedTreasury">ProtectedTreasury</a>&gt;(v0);
    <a href="../../dependencies/sui/transfer.md#sui_transfer_public_transfer">sui::transfer::public_transfer</a>&lt;<a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;<a href="../../dependencies/36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8/deep.md#token_deep_DEEP">DEEP</a>&gt;&gt;(v1, <a href="../../dependencies/sui/tx_context.md#sui_tx_context_sender">sui::tx_context::sender</a>(arg1));
}
</code></pre>



</details>
