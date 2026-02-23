
<a name="deepbook_vault"></a>

# Module `deepbook::vault`

The vault holds all of the assets for this pool. At the end of all
transaction processing, the vault is used to settle the balances for the user.


-  [Struct `Vault`](#deepbook_vault_Vault)
-  [Struct `FlashLoan`](#deepbook_vault_FlashLoan)
-  [Struct `FlashLoanBorrowed`](#deepbook_vault_FlashLoanBorrowed)
-  [Constants](#@Constants_0)
-  [Function `balances`](#deepbook_vault_balances)
-  [Function `empty`](#deepbook_vault_empty)
-  [Function `settle_balance_manager`](#deepbook_vault_settle_balance_manager)
-  [Function `settle_balance_manager_permissionless`](#deepbook_vault_settle_balance_manager_permissionless)
-  [Function `withdraw_deep_to_burn`](#deepbook_vault_withdraw_deep_to_burn)
-  [Function `borrow_flashloan_base`](#deepbook_vault_borrow_flashloan_base)
-  [Function `borrow_flashloan_quote`](#deepbook_vault_borrow_flashloan_quote)
-  [Function `return_flashloan_base`](#deepbook_vault_return_flashloan_base)
-  [Function `return_flashloan_quote`](#deepbook_vault_return_flashloan_quote)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager">deepbook::balance_manager</a>;
<b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry">deepbook::registry</a>;
<b>use</b> <a href="../../dependencies/std/address.md#std_address">std::address</a>;
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
<b>use</b> <a href="../../dependencies/sui/versioned.md#sui_versioned">sui::versioned</a>;
<b>use</b> token::deep;
</code></pre>



<a name="deepbook_vault_Vault"></a>

## Struct `Vault`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;<b>phantom</b> BaseAsset, <b>phantom</b> QuoteAsset&gt; <b>has</b> store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>base_balance: <a href="../../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;BaseAsset&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>quote_balance: <a href="../../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;QuoteAsset&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>deep_balance: <a href="../../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;token::deep::DEEP&gt;</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_vault_FlashLoan"></a>

## Struct `FlashLoan`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a>
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>borrow_quantity: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>type_name: <a href="../../dependencies/std/type_name.md#std_type_name_TypeName">std::type_name::TypeName</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_vault_FlashLoanBorrowed"></a>

## Struct `FlashLoanBorrowed`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoanBorrowed">FlashLoanBorrowed</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>borrow_quantity: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>type_name: <a href="../../dependencies/std/type_name.md#std_type_name_TypeName">std::type_name::TypeName</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="deepbook_vault_ENotEnoughBaseForLoan"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_ENotEnoughBaseForLoan">ENotEnoughBaseForLoan</a>: u64 = 1;
</code></pre>



<a name="deepbook_vault_ENotEnoughQuoteForLoan"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_ENotEnoughQuoteForLoan">ENotEnoughQuoteForLoan</a>: u64 = 2;
</code></pre>



<a name="deepbook_vault_EInvalidLoanQuantity"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EInvalidLoanQuantity">EInvalidLoanQuantity</a>: u64 = 3;
</code></pre>



<a name="deepbook_vault_EIncorrectLoanPool"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectLoanPool">EIncorrectLoanPool</a>: u64 = 4;
</code></pre>



<a name="deepbook_vault_EIncorrectTypeReturned"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectTypeReturned">EIncorrectTypeReturned</a>: u64 = 5;
</code></pre>



<a name="deepbook_vault_EIncorrectQuantityReturned"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectQuantityReturned">EIncorrectQuantityReturned</a>: u64 = 6;
</code></pre>



<a name="deepbook_vault_ENoBalanceToSettle"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_ENoBalanceToSettle">ENoBalanceToSettle</a>: u64 = 7;
</code></pre>



<a name="deepbook_vault_EHasOwedBalances"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EHasOwedBalances">EHasOwedBalances</a>: u64 = 8;
</code></pre>



<a name="deepbook_vault_balances"></a>

## Function `balances`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_balances">balances</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;): (u64, u64, u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_balances">balances</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
): (u64, u64, u64) {
    (self.base_balance.value(), self.quote_balance.value(), self.deep_balance.value())
}
</code></pre>



</details>

<a name="deepbook_vault_empty"></a>

## Function `empty`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_empty">empty</a>&lt;BaseAsset, QuoteAsset&gt;(): <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_empty">empty</a>&lt;BaseAsset, QuoteAsset&gt;(): <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt; {
    <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a> {
        base_balance: balance::zero(),
        quote_balance: balance::zero(),
        deep_balance: balance::zero(),
    }
}
</code></pre>



</details>

<a name="deepbook_vault_settle_balance_manager"></a>

## Function `settle_balance_manager`

Transfer any settled amounts for the <code>balance_manager</code>.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_settle_balance_manager">settle_balance_manager</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, balances_out: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, balances_in: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, balance_manager: &<b>mut</b> <a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager_BalanceManager">deepbook::balance_manager::BalanceManager</a>, trade_proof: &<a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager_TradeProof">deepbook::balance_manager::TradeProof</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_settle_balance_manager">settle_balance_manager</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    balances_out: Balances,
    balances_in: Balances,
    balance_manager: &<b>mut</b> BalanceManager,
    trade_proof: &TradeProof,
) {
    balance_manager.validate_proof(trade_proof);
    <b>if</b> (balances_out.base() &gt; balances_in.base()) {
        <b>let</b> balance = self.base_balance.split(balances_out.base() - balances_in.base());
        balance_manager.deposit_with_proof(trade_proof, balance);
    };
    <b>if</b> (balances_out.quote() &gt; balances_in.quote()) {
        <b>let</b> balance = self.quote_balance.split(balances_out.quote() - balances_in.quote());
        balance_manager.deposit_with_proof(trade_proof, balance);
    };
    <b>if</b> (balances_out.deep() &gt; balances_in.deep()) {
        <b>let</b> balance = self.deep_balance.split(balances_out.deep() - balances_in.deep());
        balance_manager.deposit_with_proof(trade_proof, balance);
    };
    <b>if</b> (balances_in.base() &gt; balances_out.base()) {
        <b>let</b> balance = balance_manager.withdraw_with_proof(
            trade_proof,
            balances_in.base() - balances_out.base(),
            <b>false</b>,
        );
        self.base_balance.join(balance);
    };
    <b>if</b> (balances_in.quote() &gt; balances_out.quote()) {
        <b>let</b> balance = balance_manager.withdraw_with_proof(
            trade_proof,
            balances_in.quote() - balances_out.quote(),
            <b>false</b>,
        );
        self.quote_balance.join(balance);
    };
    <b>if</b> (balances_in.deep() &gt; balances_out.deep()) {
        <b>let</b> balance = balance_manager.withdraw_with_proof(
            trade_proof,
            balances_in.deep() - balances_out.deep(),
            <b>false</b>,
        );
        self.deep_balance.join(balance);
    };
}
</code></pre>



</details>

<a name="deepbook_vault_settle_balance_manager_permissionless"></a>

## Function `settle_balance_manager_permissionless`

Transfer any settled amounts for the <code>balance_manager</code>.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_settle_balance_manager_permissionless">settle_balance_manager_permissionless</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, balances_out: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, balances_in: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, balance_manager: &<b>mut</b> <a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager_BalanceManager">deepbook::balance_manager::BalanceManager</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_settle_balance_manager_permissionless">settle_balance_manager_permissionless</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    balances_out: Balances,
    balances_in: Balances,
    balance_manager: &<b>mut</b> BalanceManager,
) {
    <b>assert</b>!(
        balances_in.base() == 0 && balances_in.quote() == 0 && balances_in.deep() == 0,
        <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EHasOwedBalances">EHasOwedBalances</a>,
    );
    <b>let</b> has_settled_balances =
        balances_out.base() &gt; 0
        || balances_out.quote() &gt; 0
        || balances_out.deep() &gt; 0;
    <b>assert</b>!(has_settled_balances, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_ENoBalanceToSettle">ENoBalanceToSettle</a>);
    <b>if</b> (balances_out.base() &gt; 0) {
        <b>let</b> balance = self.base_balance.split(balances_out.base());
        balance_manager.deposit_permissionless(balance);
    };
    <b>if</b> (balances_out.quote() &gt; 0) {
        <b>let</b> balance = self.quote_balance.split(balances_out.quote());
        balance_manager.deposit_permissionless(balance);
    };
    <b>if</b> (balances_out.deep() &gt; 0) {
        <b>let</b> balance = self.deep_balance.split(balances_out.deep());
        balance_manager.deposit_permissionless(balance);
    };
}
</code></pre>



</details>

<a name="deepbook_vault_withdraw_deep_to_burn"></a>

## Function `withdraw_deep_to_burn`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_withdraw_deep_to_burn">withdraw_deep_to_burn</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, amount_to_burn: u64): <a href="../../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;token::deep::DEEP&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_withdraw_deep_to_burn">withdraw_deep_to_burn</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    amount_to_burn: u64,
): Balance&lt;DEEP&gt; {
    self.deep_balance.split(amount_to_burn)
}
</code></pre>



</details>

<a name="deepbook_vault_borrow_flashloan_base"></a>

## Function `borrow_flashloan_base`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_borrow_flashloan_base">borrow_flashloan_base</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, borrow_quantity: u64, ctx: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;BaseAsset&gt;, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">deepbook::vault::FlashLoan</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_borrow_flashloan_base">borrow_flashloan_base</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    pool_id: ID,
    borrow_quantity: u64,
    ctx: &<b>mut</b> TxContext,
): (Coin&lt;BaseAsset&gt;, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a>) {
    <b>assert</b>!(borrow_quantity &gt; 0, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EInvalidLoanQuantity">EInvalidLoanQuantity</a>);
    <b>assert</b>!(self.base_balance.value() &gt;= borrow_quantity, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_ENotEnoughBaseForLoan">ENotEnoughBaseForLoan</a>);
    <b>let</b> borrow_type_name = type_name::with_defining_ids&lt;BaseAsset&gt;();
    <b>let</b> borrow: Coin&lt;BaseAsset&gt; = self.base_balance.split(borrow_quantity).into_coin(ctx);
    <b>let</b> flash_loan = <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a> {
        pool_id,
        borrow_quantity,
        type_name: borrow_type_name,
    };
    event::emit(<a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoanBorrowed">FlashLoanBorrowed</a> {
        pool_id,
        borrow_quantity,
        type_name: borrow_type_name,
    });
    (borrow, flash_loan)
}
</code></pre>



</details>

<a name="deepbook_vault_borrow_flashloan_quote"></a>

## Function `borrow_flashloan_quote`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_borrow_flashloan_quote">borrow_flashloan_quote</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, borrow_quantity: u64, ctx: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;QuoteAsset&gt;, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">deepbook::vault::FlashLoan</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_borrow_flashloan_quote">borrow_flashloan_quote</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    pool_id: ID,
    borrow_quantity: u64,
    ctx: &<b>mut</b> TxContext,
): (Coin&lt;QuoteAsset&gt;, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a>) {
    <b>assert</b>!(borrow_quantity &gt; 0, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EInvalidLoanQuantity">EInvalidLoanQuantity</a>);
    <b>assert</b>!(self.quote_balance.value() &gt;= borrow_quantity, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_ENotEnoughQuoteForLoan">ENotEnoughQuoteForLoan</a>);
    <b>let</b> borrow_type_name = type_name::with_defining_ids&lt;QuoteAsset&gt;();
    <b>let</b> borrow: Coin&lt;QuoteAsset&gt; = self.quote_balance.split(borrow_quantity).into_coin(ctx);
    <b>let</b> flash_loan = <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a> {
        pool_id,
        borrow_quantity,
        type_name: borrow_type_name,
    };
    event::emit(<a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoanBorrowed">FlashLoanBorrowed</a> {
        pool_id,
        borrow_quantity,
        type_name: borrow_type_name,
    });
    (borrow, flash_loan)
}
</code></pre>



</details>

<a name="deepbook_vault_return_flashloan_base"></a>

## Function `return_flashloan_base`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_return_flashloan_base">return_flashloan_base</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, coin: <a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;BaseAsset&gt;, flash_loan: <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">deepbook::vault::FlashLoan</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_return_flashloan_base">return_flashloan_base</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    pool_id: ID,
    coin: Coin&lt;BaseAsset&gt;,
    flash_loan: <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a>,
) {
    <b>assert</b>!(pool_id == flash_loan.pool_id, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectLoanPool">EIncorrectLoanPool</a>);
    <b>assert</b>!(
        type_name::with_defining_ids&lt;BaseAsset&gt;() == flash_loan.type_name,
        <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectTypeReturned">EIncorrectTypeReturned</a>,
    );
    <b>assert</b>!(coin.value() == flash_loan.borrow_quantity, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectQuantityReturned">EIncorrectQuantityReturned</a>);
    self.base_balance.join(coin.into_balance&lt;BaseAsset&gt;());
    <b>let</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a> {
        pool_id: _,
        borrow_quantity: _,
        type_name: _,
    } = flash_loan;
}
</code></pre>



</details>

<a name="deepbook_vault_return_flashloan_quote"></a>

## Function `return_flashloan_quote`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_return_flashloan_quote">return_flashloan_quote</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">deepbook::vault::Vault</a>&lt;BaseAsset, QuoteAsset&gt;, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, coin: <a href="../../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;QuoteAsset&gt;, flash_loan: <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">deepbook::vault::FlashLoan</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_return_flashloan_quote">return_flashloan_quote</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_Vault">Vault</a>&lt;BaseAsset, QuoteAsset&gt;,
    pool_id: ID,
    coin: Coin&lt;QuoteAsset&gt;,
    flash_loan: <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a>,
) {
    <b>assert</b>!(pool_id == flash_loan.pool_id, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectLoanPool">EIncorrectLoanPool</a>);
    <b>assert</b>!(
        type_name::with_defining_ids&lt;QuoteAsset&gt;() == flash_loan.type_name,
        <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectTypeReturned">EIncorrectTypeReturned</a>,
    );
    <b>assert</b>!(coin.value() == flash_loan.borrow_quantity, <a href="../../dependencies/deepbook/vault.md#deepbook_vault_EIncorrectQuantityReturned">EIncorrectQuantityReturned</a>);
    self.quote_balance.join(coin.into_balance&lt;QuoteAsset&gt;());
    <b>let</b> <a href="../../dependencies/deepbook/vault.md#deepbook_vault_FlashLoan">FlashLoan</a> {
        pool_id: _,
        borrow_quantity: _,
        type_name: _,
    } = flash_loan;
}
</code></pre>



</details>
