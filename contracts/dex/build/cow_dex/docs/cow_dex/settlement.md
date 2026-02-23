
<a name="cow_dex_settlement"></a>

# Module `cow_dex::settlement`



-  [Struct `SettlementTicket`](#cow_dex_settlement_SettlementTicket)
-  [Struct `CommitEntry`](#cow_dex_settlement_CommitEntry)
-  [Struct `AuctionState`](#cow_dex_settlement_AuctionState)
-  [Struct `WinnerSelectedEvent`](#cow_dex_settlement_WinnerSelectedEvent)
-  [Struct `SettlementCompleteEvent`](#cow_dex_settlement_SettlementCompleteEvent)
-  [Struct `FallbackTriggeredEvent`](#cow_dex_settlement_FallbackTriggeredEvent)
-  [Enum `AuctionPhase`](#cow_dex_settlement_AuctionPhase)
-  [Constants](#@Constants_0)
-  [Function `open_batch`](#cow_dex_settlement_open_batch)
-  [Function `commit`](#cow_dex_settlement_commit)
-  [Function `close_commits`](#cow_dex_settlement_close_commits)
-  [Function `open_settlement`](#cow_dex_settlement_open_settlement)
-  [Function `process_intent`](#cow_dex_settlement_process_intent)
-  [Function `close_settlement`](#cow_dex_settlement_close_settlement)
-  [Function `trigger_fallback`](#cow_dex_settlement_trigger_fallback)
-  [Function `claim_refund`](#cow_dex_settlement_claim_refund)
-  [Function `phase`](#cow_dex_settlement_phase)
-  [Function `batch_id`](#cow_dex_settlement_batch_id)
-  [Function `winner`](#cow_dex_settlement_winner)
-  [Function `winner_score`](#cow_dex_settlement_winner_score)
-  [Function `commit_end_ms`](#cow_dex_settlement_commit_end_ms)
-  [Function `execute_deadline_ms`](#cow_dex_settlement_execute_deadline_ms)
-  [Function `ticket_batch_id`](#cow_dex_settlement_ticket_batch_id)
-  [Function `ticket_committed_score`](#cow_dex_settlement_ticket_committed_score)
-  [Function `ticket_actual_cow_pairs`](#cow_dex_settlement_ticket_actual_cow_pairs)
-  [Function `is_commit_phase`](#cow_dex_settlement_is_commit_phase)
-  [Function `is_execute_phase`](#cow_dex_settlement_is_execute_phase)
-  [Function `is_done_phase`](#cow_dex_settlement_is_done_phase)
-  [Function `is_failed_phase`](#cow_dex_settlement_is_failed_phase)
-  [Function `max_u64`](#cow_dex_settlement_max_u64)


<pre><code><b>use</b> <a href="../cow_dex/config.md#cow_dex_config">cow_dex::config</a>;
<b>use</b> <a href="../cow_dex/intent_book.md#cow_dex_intent_book">cow_dex::intent_book</a>;
<b>use</b> <a href="../dependencies/deepbook/account.md#deepbook_account">deepbook::account</a>;
<b>use</b> <a href="../dependencies/deepbook/balance_manager.md#deepbook_balance_manager">deepbook::balance_manager</a>;
<b>use</b> <a href="../dependencies/deepbook/balances.md#deepbook_balances">deepbook::balances</a>;
<b>use</b> <a href="../dependencies/deepbook/big_vector.md#deepbook_big_vector">deepbook::big_vector</a>;
<b>use</b> <a href="../dependencies/deepbook/book.md#deepbook_book">deepbook::book</a>;
<b>use</b> <a href="../dependencies/deepbook/constants.md#deepbook_constants">deepbook::constants</a>;
<b>use</b> <a href="../dependencies/deepbook/deep_price.md#deepbook_deep_price">deepbook::deep_price</a>;
<b>use</b> <a href="../dependencies/deepbook/ewma.md#deepbook_ewma">deepbook::ewma</a>;
<b>use</b> <a href="../dependencies/deepbook/fill.md#deepbook_fill">deepbook::fill</a>;
<b>use</b> <a href="../dependencies/deepbook/governance.md#deepbook_governance">deepbook::governance</a>;
<b>use</b> <a href="../dependencies/deepbook/history.md#deepbook_history">deepbook::history</a>;
<b>use</b> <a href="../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../dependencies/deepbook/order.md#deepbook_order">deepbook::order</a>;
<b>use</b> <a href="../dependencies/deepbook/order_info.md#deepbook_order_info">deepbook::order_info</a>;
<b>use</b> <a href="../dependencies/deepbook/pool.md#deepbook_pool">deepbook::pool</a>;
<b>use</b> <a href="../dependencies/deepbook/registry.md#deepbook_registry">deepbook::registry</a>;
<b>use</b> <a href="../dependencies/deepbook/state.md#deepbook_state">deepbook::state</a>;
<b>use</b> <a href="../dependencies/deepbook/trade_params.md#deepbook_trade_params">deepbook::trade_params</a>;
<b>use</b> <a href="../dependencies/deepbook/utils.md#deepbook_utils">deepbook::utils</a>;
<b>use</b> <a href="../dependencies/deepbook/vault.md#deepbook_vault">deepbook::vault</a>;
<b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/internal.md#std_internal">std::internal</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../dependencies/std/u64.md#std_u64">std::u64</a>;
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
<b>use</b> <a href="../dependencies/sui/sui.md#sui_sui">sui::sui</a>;
<b>use</b> <a href="../dependencies/sui/table.md#sui_table">sui::table</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/types.md#sui_types">sui::types</a>;
<b>use</b> <a href="../dependencies/sui/url.md#sui_url">sui::url</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
<b>use</b> <a href="../dependencies/sui/versioned.md#sui_versioned">sui::versioned</a>;
<b>use</b> token::deep;
</code></pre>



<a name="cow_dex_settlement_SettlementTicket"></a>

## Struct `SettlementTicket`

Hot Potato — no abilities. Forces completion of settlement.
Must be consumed by close_settlement() or PTB validation fails.
Tracks actual CoW pairs delivered.

* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a></code>: Batch this ticket is for.
* <code>committed_score</code>: Winner's committed n_cow_pairs count.
* <code>actual_cow_pairs</code>: Incremented per process_intent() call.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a>
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>committed_score: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>actual_cow_pairs: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_settlement_CommitEntry"></a>

## Struct `CommitEntry`

Commitment entry for a solver in commit phase.
* <code>score</code>: Number of CoW pairs committed.
* <code>bond</code>: SUI balance for griefing protection.
* <code>timestamp</code>: When committed (for tiebreaker).


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_CommitEntry">CommitEntry</a> <b>has</b> store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>score: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>bond: <a href="../dependencies/sui/balance.md#sui_balance_Balance">sui::balance::Balance</a>&lt;<a href="../dependencies/sui/sui.md#sui_sui_SUI">sui::sui::SUI</a>&gt;</code>
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

<a name="cow_dex_settlement_AuctionState"></a>

## Struct `AuctionState`

Batch auction state machine.
* <code>id</code>: Unique object ID.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a></code>: Batch sequence number.
* <code>intent_ids</code>: Vector of Intent IDs in this batch.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a></code>: Current phase.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a></code>: Deadline for commit phase.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a></code>: Deadline for execution (commit_end + grace).
* <code>commits</code>: Table of solver commitments.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a></code>: Winning solver address.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a></code>: Winning score.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a> <b>has</b> key
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
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>intent_ids: vector&lt;<a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a>: <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionPhase">cow_dex::settlement::AuctionPhase</a></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>commits: <a href="../dependencies/sui/table.md#sui_table_Table">sui::table::Table</a>&lt;<b>address</b>, <a href="../cow_dex/settlement.md#cow_dex_settlement_CommitEntry">cow_dex::settlement::CommitEntry</a>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>: <a href="../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<b>address</b>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>runner_up: <a href="../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<b>address</b>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>runner_up_score: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_settlement_WinnerSelectedEvent"></a>

## Struct `WinnerSelectedEvent`

Emitted when winner is selected after commit phase closes.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_WinnerSelectedEvent">WinnerSelectedEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>runner_up: <a href="../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<b>address</b>&gt;</code>
</dt>
<dd>
</dd>
<dt>
<code>runner_up_score: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_settlement_SettlementCompleteEvent"></a>

## Struct `SettlementCompleteEvent`

Emitted when settlement completes successfully.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementCompleteEvent">SettlementCompleteEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>actual_cow_pairs: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>committed_score: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_settlement_FallbackTriggeredEvent"></a>

## Struct `FallbackTriggeredEvent`

Emitted when fallback is triggered (winner failed to execute).


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_FallbackTriggeredEvent">FallbackTriggeredEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>bond_slashed: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_settlement_AuctionPhase"></a>

## Enum `AuctionPhase`



<pre><code><b>public</b> <b>enum</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionPhase">AuctionPhase</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Variants</summary>


<dl>
<dt>
Variant <code>Commit</code>
</dt>
<dd>
</dd>
<dt>
Variant <code>Execute</code>
</dt>
<dd>
</dd>
<dt>
Variant <code>Done</code>
</dt>
<dd>
</dd>
<dt>
Variant <code>Failed</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_0"></a>

## Constants


<a name="cow_dex_settlement_FLOAT_SCALING"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_FLOAT_SCALING">FLOAT_SCALING</a>: u128 = 1000000000;
</code></pre>



<a name="cow_dex_settlement_EWrongPhase"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>: u64 = 0;
</code></pre>



<a name="cow_dex_settlement_EBondTooSmall"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_EBondTooSmall">EBondTooSmall</a>: u64 = 1;
</code></pre>



<a name="cow_dex_settlement_EClearingPriceMismatch"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_EClearingPriceMismatch">EClearingPriceMismatch</a>: u64 = 2;
</code></pre>



<a name="cow_dex_settlement_ENotWinner"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ENotWinner">ENotWinner</a>: u64 = 3;
</code></pre>



<a name="cow_dex_settlement_EScoreMismatch"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_EScoreMismatch">EScoreMismatch</a>: u64 = 4;
</code></pre>



<a name="cow_dex_settlement_EInvalidDeadline"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_EInvalidDeadline">EInvalidDeadline</a>: u64 = 5;
</code></pre>



<a name="cow_dex_settlement_EWrongBatch"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongBatch">EWrongBatch</a>: u64 = 6;
</code></pre>



<a name="cow_dex_settlement_ENoCommits"></a>



<pre><code><b>const</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ENoCommits">ENoCommits</a>: u64 = 7;
</code></pre>



<a name="cow_dex_settlement_open_batch"></a>

## Function `open_batch`

Open a new batch auction.
Permissionless — relay or anyone can call.

* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: GlobalConfig for protocol parameters.
* <code><a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a></code>: Batch sequence number.
* <code>intent_ids</code>: Vector of Intent IDs in this batch.
* <code>clock</code>: Sui clock.
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_open_batch">open_batch</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64, intent_ids: vector&lt;<a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>&gt;, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_open_batch">open_batch</a>(
    <a href="../cow_dex/config.md#cow_dex_config">config</a>: &GlobalConfig,
    <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: u64,
    intent_ids: vector&lt;ID&gt;,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
): <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a> {
    <b>let</b> current_time_ms = clock.timestamp_ms();
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a> = current_time_ms + <a href="../cow_dex/config.md#cow_dex_config">config</a>.commit_duration_ms();
    <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a> {
        id: object::new(ctx),
        <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>,
        intent_ids,
        <a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a>: AuctionPhase::Commit,
        <a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>,
        <a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>: <a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a> + <a href="../cow_dex/config.md#cow_dex_config">config</a>.grace_period_ms(),
        commits: table::new(ctx),
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>: <a href="../dependencies/std/option.md#std_option_none">std::option::none</a>(),
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>: 0,
        runner_up: <a href="../dependencies/std/option.md#std_option_none">std::option::none</a>(),
        runner_up_score: 0,
    }
}
</code></pre>



</details>

<a name="cow_dex_settlement_commit"></a>

## Function `commit`

Submit a score commitment during commit phase.
Winner selected on-the-fly: highest score, earliest timestamp wins.
No duplicate commits allowed.

* <code><a href="../cow_dex/config.md#cow_dex_config">config</a></code>: GlobalConfig for protocol parameters.
* <code>state</code>: AuctionState.
* <code>score</code>: n_cow_pairs committed by solver.
* <code>bond</code>: SUI bond for griefing protection.
* <code>clock</code>: Sui clock.
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_commit">commit</a>(<a href="../cow_dex/config.md#cow_dex_config">config</a>: &<a href="../cow_dex/config.md#cow_dex_config_GlobalConfig">cow_dex::config::GlobalConfig</a>, state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>, score: u64, bond: <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;<a href="../dependencies/sui/sui.md#sui_sui_SUI">sui::sui::SUI</a>&gt;, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_commit">commit</a>(
    <a href="../cow_dex/config.md#cow_dex_config">config</a>: &GlobalConfig,
    state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>,
    score: u64,
    bond: Coin&lt;SUI&gt;,
    clock: &Clock,
    ctx: &TxContext,
) {
    <b>assert</b>!(state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Commit, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>let</b> current_time_ms = clock.timestamp_ms();
    <b>assert</b>!(current_time_ms &lt; state.<a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_EInvalidDeadline">EInvalidDeadline</a>);
    <b>assert</b>!(coin::value(&bond) &gt;= <a href="../cow_dex/config.md#cow_dex_config">config</a>.min_bond(), <a href="../cow_dex/settlement.md#cow_dex_settlement_EBondTooSmall">EBondTooSmall</a>);
    <b>let</b> sender = ctx.sender();
    <b>assert</b>!(!table::contains(&state.commits, sender), <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>let</b> <b>entry</b> = <a href="../cow_dex/settlement.md#cow_dex_settlement_CommitEntry">CommitEntry</a> {
        score,
        bond: coin::into_balance(bond),
        timestamp: current_time_ms,
    };
    table::add(&<b>mut</b> state.commits, sender, <b>entry</b>);
    // Update <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> on-the-fly (highest score, earliest timestamp <b>for</b> ties)
    <b>if</b> (<a href="../dependencies/std/option.md#std_option_is_none">std::option::is_none</a>(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>)) {
        state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> = <a href="../dependencies/std/option.md#std_option_some">std::option::some</a>(sender);
        state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a> = score;
    } <b>else</b> {
        <b>let</b> current_winner = *<a href="../dependencies/std/option.md#std_option_borrow">std::option::borrow</a>(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>);
        <b>let</b> entry_ref = table::borrow(&state.commits, current_winner);
        <b>let</b> current_winner_timestamp = entry_ref.timestamp;
        <b>if</b> (score &gt; state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>) {
            // New <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> is better
            state.runner_up = <a href="../dependencies/std/option.md#std_option_some">std::option::some</a>(current_winner);
            state.runner_up_score = state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>;
            state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> = <a href="../dependencies/std/option.md#std_option_some">std::option::some</a>(sender);
            state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a> = score;
        } <b>else</b> <b>if</b> (score &gt; state.runner_up_score) {
            // Not better than <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>, but better than runner-up
            state.runner_up = <a href="../dependencies/std/option.md#std_option_some">std::option::some</a>(sender);
            state.runner_up_score = score;
        } <b>else</b> <b>if</b> (score == state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a> && current_time_ms &lt; current_winner_timestamp) {
            // Tie with <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>, but earlier timestamp
            state.runner_up = <a href="../dependencies/std/option.md#std_option_some">std::option::some</a>(current_winner);
            state.runner_up_score = state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>;
            state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> = <a href="../dependencies/std/option.md#std_option_some">std::option::some</a>(sender);
        };
    };
}
</code></pre>



</details>

<a name="cow_dex_settlement_close_commits"></a>

## Function `close_commits`

Close commit phase and transition to Execute phase.

* <code>state</code>: AuctionState.
* <code>clock</code>: Sui clock.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_close_commits">close_commits</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_close_commits">close_commits</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>, clock: &Clock) {
    <b>let</b> current_time_ms = clock.timestamp_ms();
    <b>assert</b>!(state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Commit, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>assert</b>!(current_time_ms &gt;= state.<a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_EInvalidDeadline">EInvalidDeadline</a>);
    <b>assert</b>!(option::is_some(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>), <a href="../cow_dex/settlement.md#cow_dex_settlement_ENoCommits">ENoCommits</a>);
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> = AuctionPhase::Execute;
    emit(<a href="../cow_dex/settlement.md#cow_dex_settlement_WinnerSelectedEvent">WinnerSelectedEvent</a> {
        <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: state.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>,
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>: *option::borrow(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>),
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>: state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>,
        runner_up: state.runner_up,
        runner_up_score: state.runner_up_score,
    });
}
</code></pre>



</details>

<a name="cow_dex_settlement_open_settlement"></a>

## Function `open_settlement`

Winner calls to open settlement and receive Hot Potato ticket.
Only winner can call (capability check).

* <code>state</code>: AuctionState.
* <code>clock</code>: Sui clock.
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_open_settlement">open_settlement</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">cow_dex::settlement::SettlementTicket</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_open_settlement">open_settlement</a>(
    state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>,
    clock: &Clock,
    ctx: &TxContext,
): <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a> {
    <b>let</b> current_time_ms = clock.timestamp_ms();
    <b>assert</b>!(state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Execute, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>assert</b>!(current_time_ms &lt;= state.<a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_EInvalidDeadline">EInvalidDeadline</a>);
    <b>assert</b>!(<a href="../dependencies/std/option.md#std_option_is_some">std::option::is_some</a>(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>), <a href="../cow_dex/settlement.md#cow_dex_settlement_ENotWinner">ENotWinner</a>);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> = *<a href="../dependencies/std/option.md#std_option_borrow">std::option::borrow</a>(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>);
    <b>assert</b>!(<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> == ctx.sender(), <a href="../cow_dex/settlement.md#cow_dex_settlement_ENotWinner">ENotWinner</a>);
    <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a> {
        <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: state.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>,
        committed_score: state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>,
        actual_cow_pairs: 0,
    }
}
</code></pre>



</details>

<a name="cow_dex_settlement_process_intent"></a>

## Function `process_intent`

Process a single CoW pair intent.
[v2.3 Optimized] Uses 2 phantom types for type-safe SellCoin ↔ BuyCoin matching.
Takes Intent by value (deletes it — replay protection).
Calculates EBBO floor on-chain using DeepBook pool (solver cannot fake prices).
Increments actual_cow_pairs counter in ticket.
Only holder of SettlementTicket can call (only winner has it).

* <code>ticket</code>: SettlementTicket (must be mutable to increment counter).
* <code>intent</code>: Intent<SellCoin, BuyCoin> (taken by value, deleted atomically).
* <code>payout</code>: Solver's payout coin of type BuyCoin (from any source: flash, inventory).
* <code>pool</code>: DeepBook pool for on-chain price verification (immutable).
* <code>clock</code>: Sui clock for DeepBook mid_price calculation.
* <code>ctx</code>: Transaction context.

Type Parameters:
* <code>SellCoin</code>: Coin type user was selling (user input locked in Intent).
* <code>BuyCoin</code>: Coin type user is receiving (payout coin provided by solver).


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_process_intent">process_intent</a>&lt;SellCoin, BuyCoin&gt;(ticket: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">cow_dex::settlement::SettlementTicket</a>, intent: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;, payout: <a href="../dependencies/sui/coin.md#sui_coin_Coin">sui::coin::Coin</a>&lt;BuyCoin&gt;, pool: &<a href="../dependencies/deepbook/pool.md#deepbook_pool_Pool">deepbook::pool::Pool</a>&lt;SellCoin, BuyCoin&gt;, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_process_intent">process_intent</a>&lt;SellCoin, BuyCoin&gt;(
    ticket: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a>,
    intent: <a href="../cow_dex/intent_book.md#cow_dex_intent_book_Intent">cow_dex::intent_book::Intent</a>&lt;SellCoin, BuyCoin&gt;,
    payout: Coin&lt;BuyCoin&gt;,
    pool: &DeepbookPool&lt;SellCoin, BuyCoin&gt;,
    clock: &Clock,
    ctx: &<b>mut</b> TxContext,
) {
    // 1. Verify intent belongs to this batch
    <b>let</b> intent_batch_id = <a href="../cow_dex/intent_book.md#cow_dex_intent_book_batch_id">cow_dex::intent_book::batch_id</a>(&intent);
    <b>assert</b>!(option::is_some(&intent_batch_id), <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongBatch">EWrongBatch</a>);
    <b>assert</b>!(*option::borrow(&intent_batch_id) == ticket.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongBatch">EWrongBatch</a>);
    // 2. Consume intent on-chain (deleted — replay impossible by Sui linear types)
    <b>let</b> (owner, sell_balance, min_amount_out, sell_amount) = <a href="../cow_dex/intent_book.md#cow_dex_intent_book_consume_intent">cow_dex::intent_book::consume_intent</a>(
        intent,
    );
    // 3. Calculate EBBO floor on-chain using DeepBook mid_price
    <b>let</b> mid_price = <a href="../dependencies/deepbook/pool.md#deepbook_pool_mid_price">deepbook::pool::mid_price</a>(pool, clock);
    // fair_out = sell_amount * mid_price / <a href="../cow_dex/settlement.md#cow_dex_settlement_FLOAT_SCALING">FLOAT_SCALING</a> (raw math, no decimals needed)
    <b>let</b> fair_out_u128 = (sell_amount <b>as</b> u128) * (mid_price <b>as</b> u128) / <a href="../cow_dex/settlement.md#cow_dex_settlement_FLOAT_SCALING">FLOAT_SCALING</a>;
    // Safety check: prevent overflow when casting back to u64
    <b>assert</b>!(fair_out_u128 &lt;= (9_223_372_036_854_775_807u128), <a href="../cow_dex/settlement.md#cow_dex_settlement_EClearingPriceMismatch">EClearingPriceMismatch</a>); // i64::MAX
    <b>let</b> fair_out = (fair_out_u128 <b>as</b> u64);
    // ebbo_floor = max(min_amount_out, fair_out * 99%)
    // Do slippage calculation in u128 to prevent overflow
    <b>let</b> slippage_u128 = (fair_out <b>as</b> u128) * 99u128 / 100u128;
    <b>assert</b>!(slippage_u128 &lt;= (9_223_372_036_854_775_807u128), <a href="../cow_dex/settlement.md#cow_dex_settlement_EClearingPriceMismatch">EClearingPriceMismatch</a>);
    <b>let</b> slippage_protection = (slippage_u128 <b>as</b> u64);
    <b>let</b> ebbo_floor = <a href="../cow_dex/settlement.md#cow_dex_settlement_max_u64">max_u64</a>(min_amount_out, slippage_protection);
    // 4. Verify payout meets floor (solver cannot fake prices)
    <b>let</b> actual = coin::value(&payout);
    <b>assert</b>!(actual &gt;= ebbo_floor, <a href="../cow_dex/settlement.md#cow_dex_settlement_EClearingPriceMismatch">EClearingPriceMismatch</a>);
    // 5. Transfer payout to user (owned object, fast path)
    transfer::public_transfer(payout, owner);
    // 6. Return sell coins to solver
    <b>let</b> sell_coin = coin::from_balance(sell_balance, ctx);
    transfer::public_transfer(sell_coin, ctx.sender());
    // 7. Increment actual CoW pair counter
    ticket.actual_cow_pairs = ticket.actual_cow_pairs + 1;
}
</code></pre>



</details>

<a name="cow_dex_settlement_close_settlement"></a>

## Function `close_settlement`

Close settlement — consume Hot Potato, verify score, return winner bond.
Last command in PTB before flash_repay().

* <code>state</code>: AuctionState.
* <code>ticket</code>: SettlementTicket (consumed — satisfaction check).
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_close_settlement">close_settlement</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>, ticket: <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">cow_dex::settlement::SettlementTicket</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_close_settlement">close_settlement</a>(
    state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>,
    ticket: <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a>,
    ctx: &<b>mut</b> TxContext,
) {
    <b>assert</b>!(state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Execute, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a> {
        <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>,
        committed_score,
        actual_cow_pairs,
    } = ticket;
    <b>assert</b>!(<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a> == state.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongBatch">EWrongBatch</a>);
    // Verify actual delivery &gt;= committed score
    <b>assert</b>!(actual_cow_pairs &gt;= committed_score, <a href="../cow_dex/settlement.md#cow_dex_settlement_EScoreMismatch">EScoreMismatch</a>);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> = *<a href="../dependencies/std/option.md#std_option_borrow">std::option::borrow</a>(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>);
    // Return <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>'s bond
    <b>let</b> <b>entry</b> = table::remove(&<b>mut</b> state.commits, <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_CommitEntry">CommitEntry</a> { bond, score: _, timestamp: _ } = <b>entry</b>;
    transfer::public_transfer(
        coin::from_balance(bond, ctx),
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>,
    );
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> = AuctionPhase::Done;
    emit(<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementCompleteEvent">SettlementCompleteEvent</a> {
        <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: state.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>,
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>,
        actual_cow_pairs,
        committed_score,
    });
}
</code></pre>



</details>

<a name="cow_dex_settlement_trigger_fallback"></a>

## Function `trigger_fallback`

Trigger fallback if winner fails to execute within grace period.
Slashes winner bond (transferred to caller as reward for triggering fallback).

* <code>state</code>: AuctionState.
* <code>clock</code>: Sui clock.
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_trigger_fallback">trigger_fallback</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>, clock: &<a href="../dependencies/sui/clock.md#sui_clock_Clock">sui::clock::Clock</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_trigger_fallback">trigger_fallback</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>, clock: &Clock, ctx: &<b>mut</b> TxContext) {
    <b>assert</b>!(state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Execute, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>let</b> current_time_ms = clock.timestamp_ms();
    <b>assert</b>!(current_time_ms &gt; state.<a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>, <a href="../cow_dex/settlement.md#cow_dex_settlement_EInvalidDeadline">EInvalidDeadline</a>);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a> = *<a href="../dependencies/std/option.md#std_option_borrow">std::option::borrow</a>(&state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>);
    <b>let</b> <b>entry</b> = table::remove(&<b>mut</b> state.commits, <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_CommitEntry">CommitEntry</a> { bond, score: _, timestamp: _ } = <b>entry</b>;
    <b>let</b> slashed_amount = balance::value(&bond);
    // Transfer slashed bond to caller (reward <b>for</b> maintaining protocol)
    // In production, this should go to a treasury <b>address</b>
    transfer::public_transfer(
        coin::from_balance(bond, ctx),
        ctx.sender(),
    );
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> = AuctionPhase::Failed;
    emit(<a href="../cow_dex/settlement.md#cow_dex_settlement_FallbackTriggeredEvent">FallbackTriggeredEvent</a> {
        <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>: state.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>,
        <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>,
        bond_slashed: slashed_amount,
    });
}
</code></pre>



</details>

<a name="cow_dex_settlement_claim_refund"></a>

## Function `claim_refund`

Losing solvers withdraw their bonds after batch is Done or Failed.

* <code>state</code>: AuctionState.
* <code>ctx</code>: Transaction context.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_claim_refund">claim_refund</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_claim_refund">claim_refund</a>(state: &<b>mut</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>, ctx: &<b>mut</b> TxContext) {
    <b>assert</b>!(state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Done || state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Failed, <a href="../cow_dex/settlement.md#cow_dex_settlement_EWrongPhase">EWrongPhase</a>);
    <b>let</b> sender = ctx.sender();
    <b>assert</b>!(table::contains(&state.commits, sender), <a href="../cow_dex/settlement.md#cow_dex_settlement_ENotWinner">ENotWinner</a>);
    <b>let</b> <b>entry</b> = table::remove(&<b>mut</b> state.commits, sender);
    <b>let</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_CommitEntry">CommitEntry</a> { bond, score: _, timestamp: _ } = <b>entry</b>;
    transfer::public_transfer(
        coin::from_balance(bond, ctx),
        sender,
    );
}
</code></pre>



</details>

<a name="cow_dex_settlement_phase"></a>

## Function `phase`

Get current phase.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionPhase">cow_dex::settlement::AuctionPhase</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): <a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionPhase">AuctionPhase</a> {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_batch_id"></a>

## Function `batch_id`

Get batch ID.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): u64 {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_winner"></a>

## Function `winner`

Get winning solver address.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): <a href="../dependencies/std/option.md#std_option_Option">std::option::Option</a>&lt;<b>address</b>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): Option&lt;<b>address</b>&gt; {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner">winner</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_winner_score"></a>

## Function `winner_score`

Get winner's committed score.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): u64 {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_winner_score">winner_score</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_commit_end_ms"></a>

## Function `commit_end_ms`

Get commit phase deadline.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): u64 {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_commit_end_ms">commit_end_ms</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_execute_deadline_ms"></a>

## Function `execute_deadline_ms`

Get execution deadline (commit_end + grace).


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): u64 {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_execute_deadline_ms">execute_deadline_ms</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_ticket_batch_id"></a>

## Function `ticket_batch_id`

Get ticket's batch ID.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ticket_batch_id">ticket_batch_id</a>(ticket: &<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">cow_dex::settlement::SettlementTicket</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ticket_batch_id">ticket_batch_id</a>(ticket: &<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a>): u64 {
    ticket.<a href="../cow_dex/settlement.md#cow_dex_settlement_batch_id">batch_id</a>
}
</code></pre>



</details>

<a name="cow_dex_settlement_ticket_committed_score"></a>

## Function `ticket_committed_score`

Get ticket's committed score.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ticket_committed_score">ticket_committed_score</a>(ticket: &<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">cow_dex::settlement::SettlementTicket</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ticket_committed_score">ticket_committed_score</a>(ticket: &<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a>): u64 {
    ticket.committed_score
}
</code></pre>



</details>

<a name="cow_dex_settlement_ticket_actual_cow_pairs"></a>

## Function `ticket_actual_cow_pairs`

Get ticket's actual CoW pairs count.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ticket_actual_cow_pairs">ticket_actual_cow_pairs</a>(ticket: &<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">cow_dex::settlement::SettlementTicket</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_ticket_actual_cow_pairs">ticket_actual_cow_pairs</a>(ticket: &<a href="../cow_dex/settlement.md#cow_dex_settlement_SettlementTicket">SettlementTicket</a>): u64 {
    ticket.actual_cow_pairs
}
</code></pre>



</details>

<a name="cow_dex_settlement_is_commit_phase"></a>

## Function `is_commit_phase`



<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_commit_phase">is_commit_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_commit_phase">is_commit_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): bool {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Commit
}
</code></pre>



</details>

<a name="cow_dex_settlement_is_execute_phase"></a>

## Function `is_execute_phase`



<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_execute_phase">is_execute_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_execute_phase">is_execute_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): bool {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Execute
}
</code></pre>



</details>

<a name="cow_dex_settlement_is_done_phase"></a>

## Function `is_done_phase`



<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_done_phase">is_done_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_done_phase">is_done_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): bool {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Done
}
</code></pre>



</details>

<a name="cow_dex_settlement_is_failed_phase"></a>

## Function `is_failed_phase`



<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_failed_phase">is_failed_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">cow_dex::settlement::AuctionState</a>): bool
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_is_failed_phase">is_failed_phase</a>(state: &<a href="../cow_dex/settlement.md#cow_dex_settlement_AuctionState">AuctionState</a>): bool {
    state.<a href="../cow_dex/settlement.md#cow_dex_settlement_phase">phase</a> == AuctionPhase::Failed
}
</code></pre>



</details>

<a name="cow_dex_settlement_max_u64"></a>

## Function `max_u64`

Return maximum of two u64 values.


<pre><code><b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_max_u64">max_u64</a>(a: u64, b: u64): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../cow_dex/settlement.md#cow_dex_settlement_max_u64">max_u64</a>(a: u64, b: u64): u64 {
    <b>if</b> (a &gt; b) a <b>else</b> b
}
</code></pre>



</details>
