
<a name="deepbook_history"></a>

# Module `deepbook::history`

History module tracks the volume data for the current epoch and past epochs.
It also tracks past trade params. Past maker fees are used to calculate
fills for old orders. The historic median is used to calculate rebates and
burns.


-  [Struct `Volumes`](#deepbook_history_Volumes)
-  [Struct `History`](#deepbook_history_History)
-  [Struct `EpochData`](#deepbook_history_EpochData)
-  [Constants](#@Constants_0)
-  [Function `empty`](#deepbook_history_empty)
-  [Function `update`](#deepbook_history_update)
-  [Function `reset_volumes`](#deepbook_history_reset_volumes)
-  [Function `calculate_rebate_amount`](#deepbook_history_calculate_rebate_amount)
-  [Function `update_historic_median`](#deepbook_history_update_historic_median)
-  [Function `add_volume`](#deepbook_history_add_volume)
-  [Function `balance_to_burn`](#deepbook_history_balance_to_burn)
-  [Function `reset_balance_to_burn`](#deepbook_history_reset_balance_to_burn)
-  [Function `historic_maker_fee`](#deepbook_history_historic_maker_fee)
-  [Function `add_total_fees_collected`](#deepbook_history_add_total_fees_collected)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params">deepbook::trade_params</a>;
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
<b>use</b> <a href="../../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
</code></pre>



<a name="deepbook_history_Volumes"></a>

## Struct `Volumes`

<code><a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">Volumes</a></code> represents volume data for a single epoch.
Using flashloans on a whitelisted pool, assuming 1_000_000 * 1_000_000_000
in volume per trade, at 1 trade per millisecond, the total volume can reach
1_000_000 * 1_000_000_000 * 1000 * 60 * 60 * 24 * 365 = 8.64e22 in one
epoch.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">Volumes</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>total_volume: u128</code>
</dt>
<dd>
</dd>
<dt>
<code>total_staked_volume: u128</code>
</dt>
<dd>
</dd>
<dt>
<code>total_fees_collected: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a></code>
</dt>
<dd>
</dd>
<dt>
<code>historic_median: u128</code>
</dt>
<dd>
</dd>
<dt>
<code>trade_params: <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params_TradeParams">deepbook::trade_params::TradeParams</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_history_History"></a>

## Struct `History`

<code><a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a></code> represents the volume data for the current epoch and past epochs.


<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a> <b>has</b> store
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
<code>epoch_created: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>volumes: <a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">deepbook::history::Volumes</a></code>
</dt>
<dd>
</dd>
<dt>
<code>historic_volumes: <a href="../../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;u64, <a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">deepbook::history::Volumes</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_history_EpochData"></a>

## Struct `EpochData`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_EpochData">EpochData</a> <b>has</b> <b>copy</b>, drop, store
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
<code>pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>total_volume: u128</code>
</dt>
<dd>
</dd>
<dt>
<code>total_staked_volume: u128</code>
</dt>
<dd>
</dd>
<dt>
<code>base_fees_collected: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>quote_fees_collected: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>deep_fees_collected: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>historic_median: u128</code>
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

<a name="@Constants_0"></a>

## Constants


<a name="deepbook_history_EHistoricVolumesNotFound"></a>



<pre><code><b>const</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_EHistoricVolumesNotFound">EHistoricVolumesNotFound</a>: u64 = 0;
</code></pre>



<a name="deepbook_history_empty"></a>

## Function `empty`

Create a new <code><a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a></code> instance. Called once upon pool creation. A single
blank <code><a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">Volumes</a></code> instance is created and added to the historic_volumes table.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_empty">empty</a>(trade_params: <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params_TradeParams">deepbook::trade_params::TradeParams</a>, epoch_created: u64, ctx: &<b>mut</b> <a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_empty">empty</a>(
    trade_params: TradeParams,
    epoch_created: u64,
    ctx: &<b>mut</b> TxContext,
): <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a> {
    <b>let</b> volumes = <a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">Volumes</a> {
        total_volume: 0,
        total_staked_volume: 0,
        total_fees_collected: balances::empty(),
        historic_median: 0,
        trade_params,
    };
    <b>let</b> <b>mut</b> history = <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a> {
        epoch: ctx.epoch(),
        epoch_created,
        volumes,
        historic_volumes: table::new(ctx),
        <a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>: 0,
    };
    history.historic_volumes.add(ctx.epoch(), volumes);
    history
}
</code></pre>



</details>

<a name="deepbook_history_update"></a>

## Function `update`

Update the epoch if it has changed. If there are accounts with rebates,
add the current epoch's volume data to the historic volumes.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_update">update</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>, trade_params: <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params_TradeParams">deepbook::trade_params::TradeParams</a>, pool_id: <a href="../../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<a href="../../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_update">update</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>,
    trade_params: TradeParams,
    pool_id: ID,
    ctx: &TxContext,
) {
    <b>let</b> epoch = ctx.epoch();
    <b>if</b> (self.epoch == epoch) <b>return</b>;
    <b>if</b> (self.historic_volumes.contains(self.epoch)) {
        self.historic_volumes.remove(self.epoch);
    };
    self.<a href="../../dependencies/deepbook/history.md#deepbook_history_update_historic_median">update_historic_median</a>();
    self.historic_volumes.add(self.epoch, self.volumes);
    event::emit(<a href="../../dependencies/deepbook/history.md#deepbook_history_EpochData">EpochData</a> {
        epoch: self.epoch,
        pool_id,
        total_volume: self.volumes.total_volume,
        total_staked_volume: self.volumes.total_staked_volume,
        base_fees_collected: self.volumes.total_fees_collected.base(),
        quote_fees_collected: self.volumes.total_fees_collected.quote(),
        deep_fees_collected: self.volumes.total_fees_collected.deep(),
        historic_median: self.volumes.historic_median,
        taker_fee: trade_params.taker_fee(),
        maker_fee: trade_params.maker_fee(),
        stake_required: trade_params.stake_required(),
    });
    self.epoch = epoch;
    self.<a href="../../dependencies/deepbook/history.md#deepbook_history_reset_volumes">reset_volumes</a>(trade_params);
    self.historic_volumes.add(self.epoch, self.volumes);
}
</code></pre>



</details>

<a name="deepbook_history_reset_volumes"></a>

## Function `reset_volumes`

Reset the current epoch's volume data.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_reset_volumes">reset_volumes</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>, trade_params: <a href="../../dependencies/deepbook/trade_params.md#deepbook_trade_params_TradeParams">deepbook::trade_params::TradeParams</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_reset_volumes">reset_volumes</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>, trade_params: TradeParams) {
    event::emit(self.volumes);
    self.volumes =
        <a href="../../dependencies/deepbook/history.md#deepbook_history_Volumes">Volumes</a> {
            total_volume: 0,
            total_staked_volume: 0,
            total_fees_collected: balances::empty(),
            historic_median: 0,
            trade_params,
        };
}
</code></pre>



</details>

<a name="deepbook_history_calculate_rebate_amount"></a>

## Function `calculate_rebate_amount`

Given the epoch's volume data and the account's volume data,
calculate and returns rebate amount, updates the burn amount.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_calculate_rebate_amount">calculate_rebate_amount</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>, prev_epoch: u64, maker_volume: u128, account_stake: u64): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_calculate_rebate_amount">calculate_rebate_amount</a>(
    self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>,
    prev_epoch: u64,
    maker_volume: u128,
    account_stake: u64,
): Balances {
    <b>assert</b>!(self.historic_volumes.contains(prev_epoch), <a href="../../dependencies/deepbook/history.md#deepbook_history_EHistoricVolumesNotFound">EHistoricVolumesNotFound</a>);
    <b>let</b> volumes = &<b>mut</b> self.historic_volumes[prev_epoch];
    <b>if</b> (volumes.trade_params.stake_required() &gt; account_stake) {
        <b>return</b> balances::empty()
    };
    <b>let</b> maker_volume = maker_volume <b>as</b> u128;
    <b>let</b> other_maker_liquidity = volumes.total_volume - maker_volume;
    <b>let</b> maker_rebate_percentage = <b>if</b> (volumes.historic_median &gt; 0) {
        constants::float_scaling_u128() - constants::float_scaling_u128().min(
            math::div_u128(other_maker_liquidity, volumes.historic_median),
        )
    } <b>else</b> {
        0
    };
    <b>let</b> maker_rebate_percentage = maker_rebate_percentage <b>as</b> u64;
    <b>let</b> maker_volume_proportion = <b>if</b> (volumes.total_staked_volume &gt; 0) {
        (math::div_u128(maker_volume, volumes.total_staked_volume)) <b>as</b> u64
    } <b>else</b> {
        0
    };
    <b>let</b> <b>mut</b> max_rebates = volumes.total_fees_collected;
    max_rebates.mul(maker_volume_proportion); // Maximum rebates possible
    <b>let</b> <b>mut</b> rebates = max_rebates;
    rebates.mul(maker_rebate_percentage); // Actual rebates
    <b>let</b> maker_burn = max_rebates.deep() - rebates.deep();
    self.<a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a> = self.<a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a> + maker_burn;
    rebates
}
</code></pre>



</details>

<a name="deepbook_history_update_historic_median"></a>

## Function `update_historic_median`

Updates the historic_median for past 28 epochs.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_update_historic_median">update_historic_median</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_update_historic_median">update_historic_median</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>) {
    <b>let</b> epochs_since_creation = self.epoch - self.epoch_created;
    <b>if</b> (epochs_since_creation &lt; constants::phase_out_epochs()) {
        self.volumes.historic_median = constants::max_u128();
        <b>return</b>
    };
    <b>let</b> <b>mut</b> median_vec = vector&lt;u128&gt;[];
    <b>let</b> <b>mut</b> i = self.epoch - constants::phase_out_epochs();
    <b>while</b> (i &lt; self.epoch) {
        <b>if</b> (self.historic_volumes.contains(i)) {
            median_vec.push_back(self.historic_volumes[i].total_volume);
        } <b>else</b> {
            median_vec.push_back(0);
        };
        i = i + 1;
    };
    self.volumes.historic_median = math::median(median_vec);
}
</code></pre>



</details>

<a name="deepbook_history_add_volume"></a>

## Function `add_volume`

Add volume to the current epoch's volume data.
Increments the total volume and total staked volume.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_add_volume">add_volume</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>, maker_volume: u64, account_stake: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_add_volume">add_volume</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>, maker_volume: u64, account_stake: u64) {
    <b>if</b> (maker_volume == 0) <b>return</b>;
    <b>let</b> maker_volume = maker_volume <b>as</b> u128;
    self.volumes.total_volume = self.volumes.total_volume + maker_volume;
    <b>if</b> (account_stake &gt;= self.volumes.trade_params.stake_required()) {
        self.volumes.total_staked_volume = self.volumes.total_staked_volume + maker_volume;
    };
}
</code></pre>



</details>

<a name="deepbook_history_balance_to_burn"></a>

## Function `balance_to_burn`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>(self: &<a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>(self: &<a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>): u64 {
    self.<a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>
}
</code></pre>



</details>

<a name="deepbook_history_reset_balance_to_burn"></a>

## Function `reset_balance_to_burn`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_reset_balance_to_burn">reset_balance_to_burn</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_reset_balance_to_burn">reset_balance_to_burn</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>): u64 {
    <b>let</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a> = self.<a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>;
    self.<a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a> = 0;
    <a href="../../dependencies/deepbook/history.md#deepbook_history_balance_to_burn">balance_to_burn</a>
}
</code></pre>



</details>

<a name="deepbook_history_historic_maker_fee"></a>

## Function `historic_maker_fee`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_historic_maker_fee">historic_maker_fee</a>(self: &<a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>, epoch: u64): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_historic_maker_fee">historic_maker_fee</a>(self: &<a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>, epoch: u64): u64 {
    <b>assert</b>!(self.historic_volumes.contains(epoch), <a href="../../dependencies/deepbook/history.md#deepbook_history_EHistoricVolumesNotFound">EHistoricVolumesNotFound</a>);
    self.historic_volumes[epoch].trade_params.maker_fee()
}
</code></pre>



</details>

<a name="deepbook_history_add_total_fees_collected"></a>

## Function `add_total_fees_collected`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_add_total_fees_collected">add_total_fees_collected</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">deepbook::history::History</a>, fees: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_add_total_fees_collected">add_total_fees_collected</a>(self: &<b>mut</b> <a href="../../dependencies/deepbook/history.md#deepbook_history_History">History</a>, fees: Balances) {
    self.volumes.total_fees_collected.add_balances(fees);
}
</code></pre>



</details>
