module cow_dex::metrics;

use sui::event;

// === Events ===

/// Settlement event emitted after successful settlement.
/// Contains all benchmark data required for    .
/// * `batch_id`: Batch sequence number.
/// * `n_intents`: Total number of intents in the batch.
/// * `n_cow_pairs`: Number of intents matched via CoW.
/// * `cow_rate_bps`: CoW rate in bps.
/// * `total_surplus_sui`: Total surplus generated in SUI (scaled).
/// * `flash_amount`: Total flash loan amount.
/// * `flash_fee`: Flash fee charged (estimated).
/// * `gas_used`: Total gas used in settlement.
/// * `solver`: Address of the winning solver.
/// * `winning_score`: Surplus score of winning solution.
/// * `runner_up_score`: Surplus score of second-best solution (0 if none).
/// * `n_solvers_committed`: Number of solvers who committed.
/// * `n_solvers_revealed`: Number of solvers who revealed.
/// * `n_shared_obj_writes`: Estimated shared object writes.
/// * `timestamp_ms`: Unix milliseconds when settlement completed.
public struct SettlementEvent has copy, drop {
    batch_id: u64,
    n_intents: u64,
    n_cow_pairs: u64,
    cow_rate_bps: u64,
    total_surplus_sui: u64,
    flash_amount: u64,
    flash_fee: u64,
    gas_used: u64,
    solver: address,
    winning_score: u64,
    runner_up_score: u64,
    n_solvers_committed: u64,
    n_solvers_revealed: u64,
    n_shared_obj_writes: u64,
    timestamp_ms: u64,
}

/// Emits a SettlementEvent after successful settlement.
/// * `batch_id`: Batch sequence number.
/// * `n_intents`: Total intents in batch.
/// * `n_cow_pairs`: Number of CoW pairs.
/// * `cow_rate_bps`: CoW rate.
/// * `total_surplus_sui`: Total surplus in SUI.
/// * `flash_amount`: Flash loan amount.
/// * `flash_fee`: Flash fee.
/// * `gas_used`: Gas used in settlement.
/// * `solver`: Winning solver address.
/// * `winning_score`: Winning solution score.
/// * `runner_up_score`: Runner-up score.
/// * `n_solvers_committed`: Number of commits.
/// * `n_solvers_revealed`: Number of reveals.
/// * `n_shared_obj_writes`: Shared object writes count.
/// * `timestamp_ms`: Settlement timestamp.
public fun emit_settlement_event(
    batch_id: u64,
    n_intents: u64,
    n_cow_pairs: u64,
    cow_rate_bps: u64,
    total_surplus_sui: u64,
    flash_amount: u64,
    flash_fee: u64,
    gas_used: u64,
    solver: address,
    winning_score: u64,
    runner_up_score: u64,
    n_solvers_committed: u64,
    n_solvers_revealed: u64,
    n_shared_obj_writes: u64,
    timestamp_ms: u64,
) {
    event::emit(SettlementEvent {
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
