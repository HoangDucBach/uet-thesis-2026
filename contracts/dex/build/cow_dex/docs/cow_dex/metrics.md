
<a name="cow_dex_metrics"></a>

# Module `cow_dex::metrics`



-  [Struct `SettlementEvent`](#cow_dex_metrics_SettlementEvent)
-  [Function `emit_settlement_event`](#cow_dex_metrics_emit_settlement_event)


<pre><code><b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
</code></pre>



<a name="cow_dex_metrics_SettlementEvent"></a>

## Struct `SettlementEvent`

Settlement event emitted after successful settlement.
Contains all benchmark data required for    .
* <code>batch_id</code>: Batch sequence number.
* <code>n_intents</code>: Total number of intents in the batch.
* <code>n_cow_pairs</code>: Number of intents matched via CoW.
* <code>cow_rate_bps</code>: CoW rate in bps.
* <code>total_surplus_sui</code>: Total surplus generated in SUI (scaled).
* <code>flash_amount</code>: Total flash loan amount.
* <code>flash_fee</code>: Flash fee charged (estimated).
* <code>gas_used</code>: Total gas used in settlement.
* <code>solver</code>: Address of the winning solver.
* <code>winning_score</code>: Surplus score of winning solution.
* <code>runner_up_score</code>: Surplus score of second-best solution (0 if none).
* <code>n_solvers_committed</code>: Number of solvers who committed.
* <code>n_solvers_revealed</code>: Number of solvers who revealed.
* <code>n_shared_obj_writes</code>: Estimated shared object writes.
* <code>timestamp_ms</code>: Unix milliseconds when settlement completed.


<pre><code><b>public</b> <b>struct</b> <a href="../cow_dex/metrics.md#cow_dex_metrics_SettlementEvent">SettlementEvent</a> <b>has</b> <b>copy</b>, drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>batch_id: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>n_intents: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>n_cow_pairs: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>cow_rate_bps: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>total_surplus_sui: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>flash_amount: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>flash_fee: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>gas_used: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>solver: <b>address</b></code>
</dt>
<dd>
</dd>
<dt>
<code>winning_score: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>runner_up_score: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>n_solvers_committed: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>n_solvers_revealed: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>n_shared_obj_writes: u64</code>
</dt>
<dd>
</dd>
<dt>
<code>timestamp_ms: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="cow_dex_metrics_emit_settlement_event"></a>

## Function `emit_settlement_event`

Emits a SettlementEvent after successful settlement.
* <code>batch_id</code>: Batch sequence number.
* <code>n_intents</code>: Total intents in batch.
* <code>n_cow_pairs</code>: Number of CoW pairs.
* <code>cow_rate_bps</code>: CoW rate.
* <code>total_surplus_sui</code>: Total surplus in SUI.
* <code>flash_amount</code>: Flash loan amount.
* <code>flash_fee</code>: Flash fee.
* <code>gas_used</code>: Gas used in settlement.
* <code>solver</code>: Winning solver address.
* <code>winning_score</code>: Winning solution score.
* <code>runner_up_score</code>: Runner-up score.
* <code>n_solvers_committed</code>: Number of commits.
* <code>n_solvers_revealed</code>: Number of reveals.
* <code>n_shared_obj_writes</code>: Shared object writes count.
* <code>timestamp_ms</code>: Settlement timestamp.


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/metrics.md#cow_dex_metrics_emit_settlement_event">emit_settlement_event</a>(batch_id: u64, n_intents: u64, n_cow_pairs: u64, cow_rate_bps: u64, total_surplus_sui: u64, flash_amount: u64, flash_fee: u64, gas_used: u64, solver: <b>address</b>, winning_score: u64, runner_up_score: u64, n_solvers_committed: u64, n_solvers_revealed: u64, n_shared_obj_writes: u64, timestamp_ms: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../cow_dex/metrics.md#cow_dex_metrics_emit_settlement_event">emit_settlement_event</a>(
    batch_id: u64,
    n_intents: u64,
    n_cow_pairs: u64,
    cow_rate_bps: u64,
    total_surplus_sui: u64,
    flash_amount: u64,
    flash_fee: u64,
    gas_used: u64,
    solver: <b>address</b>,
    winning_score: u64,
    runner_up_score: u64,
    n_solvers_committed: u64,
    n_solvers_revealed: u64,
    n_shared_obj_writes: u64,
    timestamp_ms: u64,
) {
    event::emit(<a href="../cow_dex/metrics.md#cow_dex_metrics_SettlementEvent">SettlementEvent</a> {
        batch_id,
        n_intents,
        n_cow_pairs,
        cow_rate_bps,
        total_surplus_sui,
        flash_amount,
        flash_fee,
        gas_used,
        solver,
        winning_score,
        runner_up_score,
        n_solvers_committed,
        n_solvers_revealed,
        n_shared_obj_writes,
        timestamp_ms,
    });
}
</code></pre>



</details>
