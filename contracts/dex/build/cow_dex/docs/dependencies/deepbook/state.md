
<a name="deepbook_state"></a>

# Module `deepbook::state`

State module represents the current state of the pool. It maintains all
the accounts, history, and governance information. It also processes all
the transactions and updates the state accordingly.


-  [Struct `State`](#deepbook_state_State)
-  [Struct `StakeEvent`](#deepbook_state_StakeEvent)
-  [Struct `ProposalEvent`](#deepbook_state_ProposalEvent)
-  [Struct `VoteEvent`](#deepbook_state_VoteEvent)
-  [Struct `RebateEventV2`](#deepbook_state_RebateEventV2)
-  [Struct `RebateEvent`](#deepbook_state_RebateEvent)
-  [Struct `TakerFeePenaltyApplied`](#deepbook_state_TakerFeePenaltyApplied)
-  [Constants](#@Constants_0)
-  [Function `empty`](#deepbook_state_empty)
-  [Function `process_create`](#deepbook_state_process_create)
-  [Function `withdraw_settled_amounts`](#deepbook_state_withdraw_settled_amounts)
-  [Function `process_cancel`](#deepbook_state_process_cancel)
-  [Function `process_modify`](#deepbook_state_process_modify)
-  [Function `process_stake`](#deepbook_state_process_stake)
-  [Function `process_unstake`](#deepbook_state_process_unstake)
-  [Function `process_proposal`](#deepbook_state_process_proposal)
-  [Function `process_vote`](#deepbook_state_process_vote)
-  [Function `process_claim_rebates`](#deepbook_state_process_claim_rebates)
-  [Function `governance`](#deepbook_state_governance)
-  [Function `governance_mut`](#deepbook_state_governance_mut)
-  [Function `account_exists`](#deepbook_state_account_exists)
-  [Function `account`](#deepbook_state_account)
-  [Function `history_mut`](#deepbook_state_history_mut)
-  [Function `history`](#deepbook_state_history)
-  [Function `process_fills`](#deepbook_state_process_fills)
-  [Function `update_account`](#deepbook_state_update_account)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/account.md#deepbook_account">deepbook::account</a>;
<b>use</b> <a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager">deepbook::balance_manager</a>;
<b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/deep_price.md#deepbook_deep_price">deepbook::deep_price</a>;
<b>use</b> <a href="../../dependencies/deepbook/ewma.md#deepbook_ewma">deepbook::ewma</a>;
<b>use</b> <a href="../../dependencies/deepbook/fill.md#deepbook_fill">deepbook::fill</a>;
<b>use</b> <a href="../../dependencies/deepbook/governance.md#deepbook_governance">deepbook::governance</a>;
<b>use</b> <a href="../../dependencies/deepbook/history.md#deepbook_history">deepbook::history</a>;
<b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/deepbook/order.md#deepbook_order">deepbook::order</a>;
<b>use</b> <a href="../../dependencies/deepbook/order_info.md#deepbook_order_info">deepbook::order_info</a>;
<b>use</b> <a href="../../dependencies/deepbook/registry.md#deepbook_registry">deepbook::registry</a>;
<b>use</b> <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params">deepbook::trade_params</a>;
<b>use</b> <a href="../../dependencies/deepbook/utils.md#deepbook_utils">deepbook::utils</a>;
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



<a name="deepbook_state_State"></a>

## Struct `State`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a> <b>has</b> store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>accounts: <a href="../../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, <a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>: <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>: <a href="../../dependencies/deepbook/governance.md#deepbook_governance_Governance">deepbook::governance::Governance</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_state_StakeEvent"></a>

## Struct `StakeEvent`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_StakeEvent">StakeEvent</a> <b>has</b> <b>copy</b>, drop
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
<code>balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>epoch: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>amount: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>stake: bool</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_state_ProposalEvent"></a>

## Struct `ProposalEvent`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_ProposalEvent">ProposalEvent</a> <b>has</b> <b>copy</b>, drop
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
<code>balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>epoch: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>taker_fee: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>maker_fee: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>stake_required: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_state_VoteEvent"></a>

## Struct `VoteEvent`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_VoteEvent">VoteEvent</a> <b>has</b> <b>copy</b>, drop
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
<code>balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>epoch: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>from_proposal_id: <a href="../../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>to_proposal_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>stake: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_state_RebateEventV2"></a>

## Struct `RebateEventV2`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_RebateEventV2">RebateEventV2</a> <b>has</b> <b>copy</b>, drop
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
<code>balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>epoch: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>claim_amount: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_state_RebateEvent"></a>

## Struct `RebateEvent`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_RebateEvent">RebateEvent</a> <b>has</b> <b>copy</b>, drop
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
<code>balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>epoch: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>claim_amount: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_state_TakerFeePenaltyApplied"></a>

## Struct `TakerFeePenaltyApplied`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_TakerFeePenaltyApplied">TakerFeePenaltyApplied</a> <b>has</b> <b>copy</b>, drop
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
<code>balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>order_id: u128</code>
</dt>
<dd>
</dd>
<dt>
<code>taker_fee_without_penalty: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>taker_fee: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="deepbook_state_ENoStake"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_ENoStake">ENoStake</a>: u64 = 1;
</code></pre>



<a name="deepbook_state_EMaxOpenOrders"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_EMaxOpenOrders">EMaxOpenOrders</a>: u64 = 2;
</code></pre>



<a name="deepbook_state_EAlreadyProposed"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_EAlreadyProposed">EAlreadyProposed</a>: u64 = 3;
</code></pre>



<a name="deepbook_state_empty"></a>

## Function `empty`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_empty">empty</a>(whitelisted: bool, stable_pool: bool, ctx: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_empty">empty</a>(whitelisted: bool, stable_pool: bool, ctx: &<b>mut</b> TxContext): <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a> {
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a> = governance::empty(
        whitelisted,
        stable_pool,
        ctx,
    );
    <b>let</b> trade_params = <a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params();
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a> = history::empty(trade_params, ctx.epoch(), ctx);
    <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a> { <a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>, <a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>, accounts: table::new(ctx) }
}
</code></pre>



</details>

<a name="deepbook_state_process_create"></a>

## Function `process_create`

Up until this point, an OrderInfo object has been created and potentially
filled. The OrderInfo object contains all of the necessary information to
update the state of the pool. This includes the volumes for the taker and
potentially multiple makers.
First, fills are iterated and processed, updating the appropriate user's
volumes. Funds are settled for those makers. Then, the taker's trading fee
is calculated and the taker's volumes are updated. Finally, the taker's
balances are settled.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_create">process_create</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, order_info: &<b>mut</b> <a href="../../dependencies/deepbook/order_info.md#deepbook_order_info_OrderInfo">deepbook::order_info::OrderInfo</a>, ewma_state: &<a href="../../dependencies/deepbook/ewma.md#deepbook_ewma_EWMAState">deepbook::ewma::EWMAState</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_create">process_create</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    order_info: &<b>mut</b> OrderInfo,
    ewma_state: &EWMAState,
    pool_id: ID,
    ctx: &TxContext,
): (Balances, Balances) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    <b>let</b> fills = order_info.fills_ref();
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_process_fills">process_fills</a>(fills, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(order_info.balance_manager_id(), ctx);
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[order_info.balance_manager_id()];
    <b>let</b> account_volume = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.total_volume();
    <b>let</b> account_stake = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake();
    // avg exucuted price <b>for</b> taker
    <b>let</b> avg_executed_price = <b>if</b> (order_info.executed_quantity() &gt; 0) {
        math::div(
            order_info.cumulative_quote_quantity(),
            order_info.executed_quantity(),
        )
    } <b>else</b> {
        0
    };
    <b>let</b> account_volume_in_deep = order_info
        .order_deep_price()
        .deep_quantity_u128(
            account_volume,
            math::mul_u128(account_volume, avg_executed_price <b>as</b> u128),
        );
    // taker fee will always be calculated <b>as</b> 0 <b>for</b> whitelisted pools by
    // default, <b>as</b> account_volume_in_deep is 0
    <b>let</b> taker_fee_without_penalty = self
        .<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>
        .trade_params()
        .taker_fee_for_user(account_stake, account_volume_in_deep);
    <b>let</b> taker_fee = ewma_state.apply_taker_penalty(taker_fee_without_penalty, ctx);
    <b>if</b> (taker_fee &gt; taker_fee_without_penalty) {
        event::emit(<a href="../../dependencies/deepbook/state.md#deepbook_state_TakerFeePenaltyApplied">TakerFeePenaltyApplied</a> {
            pool_id,
            balance_manager_id: order_info.balance_manager_id(),
            order_id: order_info.order_id(),
            taker_fee_without_penalty,
            taker_fee,
        });
    };
    <b>let</b> maker_fee = self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params().maker_fee();
    <b>if</b> (order_info.order_inserted()) {
        <b>assert</b>!(<a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.open_orders().length() &lt; constants::max_open_orders(), <a href="../../dependencies/deepbook/state.md#deepbook_state_EMaxOpenOrders">EMaxOpenOrders</a>);
        <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.add_order(order_info.order_id());
    };
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.add_taker_volume(order_info.executed_quantity());
    <b>let</b> (<b>mut</b> settled, <b>mut</b> owed) = order_info.calculate_partial_fill_balances(
        taker_fee,
        maker_fee,
    );
    <b>let</b> (old_settled, old_owed) = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.settle();
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.add_total_fees_collected(order_info.paid_fees_balances());
    settled.add_balances(old_settled);
    owed.add_balances(old_owed);
    (settled, owed)
}
</code></pre>



</details>

<a name="deepbook_state_withdraw_settled_amounts"></a>

## Function `withdraw_settled_amounts`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_withdraw_settled_amounts">withdraw_settled_amounts</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_withdraw_settled_amounts">withdraw_settled_amounts</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    balance_manager_id: ID,
): (Balances, Balances) {
    <b>if</b> (self.accounts.contains(balance_manager_id)) {
        <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
        <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.settle()
    } <b>else</b> {
        (balances::empty(), balances::empty())
    }
}
</code></pre>



</details>

<a name="deepbook_state_process_cancel"></a>

## Function `process_cancel`

Update account settled balances and volumes.
Remove order from account orders.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_cancel">process_cancel</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, order: &<b>mut</b> <a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_cancel">process_cancel</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    order: &<b>mut</b> Order,
    balance_manager_id: ID,
    pool_id: ID,
    ctx: &TxContext,
): (Balances, Balances) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    order.set_canceled();
    <b>let</b> epoch = order.epoch();
    <b>let</b> maker_fee = self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.historic_maker_fee(epoch);
    <b>let</b> balances = order.calculate_cancel_refund(maker_fee, option::none());
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.remove_order(order.order_id());
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.add_settled_balances(balances);
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.settle()
}
</code></pre>



</details>

<a name="deepbook_state_process_modify"></a>

## Function `process_modify`

Given the modified quantity, update account settled balances and volumes.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_modify">process_modify</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, cancel_quantity: u64, order: &<a href="../../dependencies/deepbook/order.md#deepbook_order_Order">deepbook::order::Order</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_modify">process_modify</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    balance_manager_id: ID,
    cancel_quantity: u64,
    order: &Order,
    pool_id: ID,
    ctx: &TxContext,
): (Balances, Balances) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    <b>let</b> epoch = order.epoch();
    <b>let</b> maker_fee = self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.historic_maker_fee(epoch);
    <b>let</b> balances = order.calculate_cancel_refund(
        maker_fee,
        option::some(cancel_quantity),
    );
    self.accounts[balance_manager_id].add_settled_balances(balances);
    self.accounts[balance_manager_id].settle()
}
</code></pre>



</details>

<a name="deepbook_state_process_stake"></a>

## Function `process_stake`

Process stake transaction. Add stake to account and update governance.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_stake">process_stake</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, new_stake: u64, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_stake">process_stake</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    pool_id: ID,
    balance_manager_id: ID,
    new_stake: u64,
    ctx: &TxContext,
): (Balances, Balances) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    <b>let</b> (stake_before, stake_after) = self.accounts[balance_manager_id].add_stake(new_stake);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.adjust_voting_power(stake_before, stake_after);
    event::emit(<a href="../../dependencies/deepbook/state.md#deepbook_state_StakeEvent">StakeEvent</a> {
        pool_id,
        balance_manager_id,
        epoch: ctx.epoch(),
        amount: new_stake,
        stake: <b>true</b>,
    });
    self.accounts[balance_manager_id].settle()
}
</code></pre>



</details>

<a name="deepbook_state_process_unstake"></a>

## Function `process_unstake`

Process unstake transaction.
Remove stake from account and update governance.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_unstake">process_unstake</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_unstake">process_unstake</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    pool_id: ID,
    balance_manager_id: ID,
    ctx: &TxContext,
): (Balances, Balances) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
    <b>let</b> active_stake = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake();
    <b>let</b> inactive_stake = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.inactive_stake();
    <b>let</b> voted_proposal = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.voted_proposal();
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.remove_stake();
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.adjust_voting_power(active_stake + inactive_stake, 0);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.adjust_vote(voted_proposal, option::none(), active_stake);
    event::emit(<a href="../../dependencies/deepbook/state.md#deepbook_state_StakeEvent">StakeEvent</a> {
        pool_id,
        balance_manager_id,
        epoch: ctx.epoch(),
        amount: active_stake + inactive_stake,
        stake: <b>false</b>,
    });
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.settle()
}
</code></pre>



</details>

<a name="deepbook_state_process_proposal"></a>

## Function `process_proposal`

Process proposal transaction. Add proposal to governance and update account.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_proposal">process_proposal</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, taker_fee: u64, maker_fee: u64, stake_required: u64, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_proposal">process_proposal</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    pool_id: ID,
    balance_manager_id: ID,
    taker_fee: u64,
    maker_fee: u64,
    stake_required: u64,
    ctx: &TxContext,
) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
    <b>let</b> stake = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake();
    <b>let</b> proposal_created = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.created_proposal();
    <b>assert</b>!(stake &gt; 0, <a href="../../dependencies/deepbook/state.md#deepbook_state_ENoStake">ENoStake</a>);
    <b>assert</b>!(!proposal_created, <a href="../../dependencies/deepbook/state.md#deepbook_state_EAlreadyProposed">EAlreadyProposed</a>);
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.set_created_proposal(<b>true</b>);
    self
        .<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>
        .add_proposal(
            taker_fee,
            maker_fee,
            stake_required,
            stake,
            balance_manager_id,
        );
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_process_vote">process_vote</a>(pool_id, balance_manager_id, balance_manager_id, ctx);
    event::emit(<a href="../../dependencies/deepbook/state.md#deepbook_state_ProposalEvent">ProposalEvent</a> {
        pool_id,
        balance_manager_id,
        epoch: ctx.epoch(),
        taker_fee,
        maker_fee,
        stake_required,
    });
}
</code></pre>



</details>

<a name="deepbook_state_process_vote"></a>

## Function `process_vote`

Process vote transaction. Update account voted proposal and governance.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_vote">process_vote</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, proposal_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_vote">process_vote</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    pool_id: ID,
    balance_manager_id: ID,
    proposal_id: ID,
    ctx: &TxContext,
) {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
    <b>assert</b>!(<a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake() &gt; 0, <a href="../../dependencies/deepbook/state.md#deepbook_state_ENoStake">ENoStake</a>);
    <b>let</b> prev_proposal = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.set_voted_proposal(option::some(proposal_id));
    self
        .<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>
        .adjust_vote(
            prev_proposal,
            option::some(proposal_id),
            <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake(),
        );
    event::emit(<a href="../../dependencies/deepbook/state.md#deepbook_state_VoteEvent">VoteEvent</a> {
        pool_id,
        balance_manager_id,
        epoch: ctx.epoch(),
        from_proposal_id: prev_proposal,
        to_proposal_id: proposal_id,
        stake: <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake(),
    });
}
</code></pre>



</details>

<a name="deepbook_state_process_claim_rebates"></a>

## Function `process_claim_rebates`

Process claim rebates transaction.
Update account rebates and settle balances.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_claim_rebates">process_claim_rebates</a>&lt;BaseAsset, QuoteAsset&gt;(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, balance_manager: &<a href="../../dependencies/deepbook/balance_manager.md#deepbook_balance_manager_BalanceManager">deepbook::balance_manager::BalanceManager</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): (<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_claim_rebates">process_claim_rebates</a>&lt;BaseAsset, QuoteAsset&gt;(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>,
    pool_id: ID,
    balance_manager: &BalanceManager,
    ctx: &TxContext,
): (Balances, Balances) {
    <b>let</b> balance_manager_id = balance_manager.id();
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.update(self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.trade_params(), pool_id, ctx);
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(balance_manager_id, ctx);
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
    <b>let</b> claim_amount = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.claim_rebates();
    event::emit(<a href="../../dependencies/deepbook/state.md#deepbook_state_RebateEventV2">RebateEventV2</a> {
        pool_id,
        balance_manager_id,
        epoch: ctx.epoch(),
        claim_amount,
    });
    balance_manager.emit_balance_event(
        type_name::with_defining_ids&lt;DEEP&gt;(),
        claim_amount.deep(),
        <b>true</b>,
    );
    balance_manager.emit_balance_event(
        type_name::with_defining_ids&lt;BaseAsset&gt;(),
        claim_amount.base(),
        <b>true</b>,
    );
    balance_manager.emit_balance_event(
        type_name::with_defining_ids&lt;QuoteAsset&gt;(),
        claim_amount.quote(),
        <b>true</b>,
    );
    <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.settle()
}
</code></pre>



</details>

<a name="deepbook_state_governance"></a>

## Function `governance`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>): &<a href="../../dependencies/deepbook/governance.md#deepbook_governance_Governance">deepbook::governance::Governance</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>): &Governance {
    &self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>
}
</code></pre>



</details>

<a name="deepbook_state_governance_mut"></a>

## Function `governance_mut`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_governance_mut">governance_mut</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): &<b>mut</b> <a href="../../dependencies/deepbook/governance.md#deepbook_governance_Governance">deepbook::governance::Governance</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_governance_mut">governance_mut</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>, ctx: &TxContext): &<b>mut</b> Governance {
    self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>.update(ctx);
    &<b>mut</b> self.<a href="../../dependencies/deepbook/state.md#deepbook_state_governance">governance</a>
}
</code></pre>



</details>

<a name="deepbook_state_account_exists"></a>

## Function `account_exists`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account_exists">account_exists</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account_exists">account_exists</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>, balance_manager_id: ID): bool {
    self.accounts.contains(balance_manager_id)
}
</code></pre>



</details>

<a name="deepbook_state_account"></a>

## Function `account`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>): &<a href="../../dependencies/deepbook/account.md#deepbook_account_Account">deepbook::account::Account</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>, balance_manager_id: ID): &Account {
    &self.accounts[balance_manager_id]
}
</code></pre>



</details>

<a name="deepbook_state_history_mut"></a>

## Function `history_mut`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_history_mut">history_mut</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>): &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_history_mut">history_mut</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>): &<b>mut</b> History {
    &<b>mut</b> self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>
}
</code></pre>



</details>

<a name="deepbook_state_history"></a>

## Function `history`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>): &<a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>(self: &<a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>): &History {
    &self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>
}
</code></pre>



</details>

<a name="deepbook_state_process_fills"></a>

## Function `process_fills`

Process fills for all makers. Update maker accounts and history.


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_fills">process_fills</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, fills: &<b>mut</b> vector&lt;<a href="../../dependencies/deepbook/fill.md#deepbook_fill_Fill">deepbook::fill::Fill</a>&gt;, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_process_fills">process_fills</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>, fills: &<b>mut</b> vector&lt;Fill&gt;, ctx: &TxContext) {
    <b>let</b> <b>mut</b> i = 0;
    <b>let</b> num_fills = fills.length();
    <b>while</b> (i &lt; num_fills) {
        <b>let</b> fill = &<b>mut</b> fills[i];
        <b>let</b> maker = fill.balance_manager_id();
        self.<a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(maker, ctx);
        <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[maker];
        <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.process_maker_fill(fill);
        <b>let</b> base_volume = fill.base_quantity();
        <b>let</b> quote_volume = fill.quote_quantity();
        <b>let</b> historic_maker_fee = self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.historic_maker_fee(fill.maker_epoch());
        <b>let</b> maker_is_bid = !fill.taker_is_bid();
        <b>let</b> <b>mut</b> fee_quantity = fill
            .maker_deep_price()
            .fee_quantity(base_volume, quote_volume, maker_is_bid);
        fee_quantity.mul(historic_maker_fee);
        <b>if</b> (!fill.expired()) {
            fill.set_fill_maker_fee(&fee_quantity);
            self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.add_volume(base_volume, <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.active_stake());
            self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.add_total_fees_collected(fee_quantity);
        } <b>else</b> {
            <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.add_settled_balances(fee_quantity);
        };
        i = i + 1;
    };
}
</code></pre>



</details>

<a name="deepbook_state_update_account"></a>

## Function `update_account`

If account doesn't exist, create it. Update account volumes and rebates.


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">deepbook::state::State</a>, balance_manager_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_update_account">update_account</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_State">State</a>, balance_manager_id: ID, ctx: &TxContext) {
    <b>if</b> (!self.accounts.contains(balance_manager_id)) {
        self.accounts.add(balance_manager_id, account::empty(ctx));
    };
    <b>let</b> <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a> = &<b>mut</b> self.accounts[balance_manager_id];
    <b>let</b> (prev_epoch, maker_volume, active_stake) = <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.update(ctx);
    <b>if</b> (prev_epoch &gt; 0 && maker_volume &gt; 0 && active_stake &gt; 0) {
        <b>let</b> rebates = self.<a href="../../dependencies/deepbook/state.md#deepbook_state_history">history</a>.calculate_rebate_amount(prev_epoch, maker_volume, active_stake);
        <a href="../../dependencies/deepbook/state.md#deepbook_state_account">account</a>.add_rebates(rebates);
    }
}
</code></pre>



</details>
