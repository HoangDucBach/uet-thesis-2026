/**
 * Shared CoW DEX event types, BCS schemas, and gRPC event client.
 *
 * Used by all solvers to subscribe to the Sui indexer's EventStream service.
 */

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { join } from "path";
import { bcs, fromHex, toHex } from "@mysten/bcs";

// ─── Proto path (relative to this shared module) ─────────────────────────────

const PROTO_PATH = join(
  new URL(".", import.meta.url).pathname,
  "proto",
  "cow_event.proto",
);

// ─── Relay Event Payloads ─────────────────────────────────────────────────────

export interface IntentCreatedPayload {
  intent_id: string;
  owner: string;
  sell_type: string;
  buy_type: string;
  sell_amount: string;
  min_amount_out: string;
  partial_fillable: boolean;
  deadline: string;
}

export interface BatchOpenedPayload {
  batch_id: string;
  auction_state_id: string;
  intent_ids: string[];
  commit_end_ms: string;
  execute_deadline_ms: string;
}

export interface WinnerSelectedPayload {
  batch_id: string;
  winner: string;
  winner_score: string;
}

export type RelayEvent =
  | { type: "INTENT_CREATED"; data: IntentCreatedPayload }
  | { type: "INTENT_CANCELLED"; data: { intent_id: string } }
  | { type: "BATCH_OPENED"; data: BatchOpenedPayload }
  | { type: "WINNER_SELECTED"; data: WinnerSelectedPayload };

// ─── Raw gRPC CowEvent (before BCS decode) ────────────────────────────────────

export interface RawCowEvent {
  package_id: string;
  module_name: string;
  event_name: string;
  tx_digest: string;
  checkpoint_seq: string;
  timestamp_ms: string;
  contents: Buffer;
}

// ─── BCS Event Schemas (mirrors on-chain Move structs) ────────────────────────

const BcsAddress = bcs.fixedArray(32, bcs.u8()).transform({
  input: (id: string) => fromHex(id.replace("0x", "")),
  output: (id) => `0x${toHex(Uint8Array.from(id))}`,
});

const BcsTypeName = bcs.struct("TypeName", { name: bcs.string() });

export const IntentCreatedEventBcs = bcs.struct("IntentCreatedEvent", {
  intent_id: BcsAddress,
  owner: BcsAddress,
  sell_type: BcsTypeName,
  buy_type: BcsTypeName,
  sell_amount: bcs.u64(),
  min_amount_out: bcs.u64(),
  partial_fillable: bcs.bool(),
  deadline: bcs.u64(),
});

export const IntentCancelledEventBcs = bcs.struct("IntentCancelledEvent", {
  intent_id: BcsAddress,
});

export const BatchOpenedEventBcs = bcs.struct("BatchOpenedEvent", {
  batch_id: bcs.u64(),
  auction_state_id: BcsAddress,
  intent_ids: bcs.vector(BcsAddress),
  commit_end_ms: bcs.u64(),
  execute_deadline_ms: bcs.u64(),
});

export const WinnerSelectedEventBcs = bcs.struct("WinnerSelectedEvent", {
  batch_id: bcs.u64(),
  winner: BcsAddress,
  winner_score: bcs.u64(),
  runner_up: bcs.option(BcsAddress),
  runner_up_score: bcs.u64(),
});

export const BatchAbortedEventBcs = bcs.struct("BatchAbortedEvent", {
  batch_id: bcs.u64(),
});

export const SettlementCompleteEventBcs = bcs.struct("SettlementCompleteEvent", {
  batch_id: bcs.u64(),
  winner: BcsAddress,
  actual_surplus: bcs.u64(),
  committed_score: bcs.u64(),
});

export const FallbackTriggeredEventBcs = bcs.struct("FallbackTriggeredEvent", {
  batch_id: bcs.u64(),
  winner: BcsAddress,
  bond_slashed: bcs.u64(),
});

// ─── Inferred TypeScript types ────────────────────────────────────────────────

export type IntentCreatedEventType = typeof IntentCreatedEventBcs.$inferType;
export type IntentCancelledEventType = typeof IntentCancelledEventBcs.$inferType;
export type BatchOpenedEventType = typeof BatchOpenedEventBcs.$inferType;
export type WinnerSelectedEventType = typeof WinnerSelectedEventBcs.$inferType;
export type BatchAbortedEventType = typeof BatchAbortedEventBcs.$inferType;
export type SettlementCompleteEventType = typeof SettlementCompleteEventBcs.$inferType;
export type FallbackTriggeredEventType = typeof FallbackTriggeredEventBcs.$inferType;

// ─── gRPC Event Client ────────────────────────────────────────────────────────

/**
 * Connects directly to the Sui indexer's gRPC EventStream service.
 * Decodes BCS-encoded CowEvent.contents and routes them as RelayEvents
 * to registered handlers. Auto-reconnects with exponential backoff.
 */
export class GrpcEventClient {
  private handlers: Array<(e: RelayEvent) => void> = [];
  private reconnectDelay = 1_000;
  private destroyed = false;
  private stream: grpc.ClientReadableStream<RawCowEvent> | null = null;
  private stub: grpc.Client | null = null;

  private readonly grpcProto: grpc.GrpcObject;

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {
    const def = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    this.grpcProto = grpc.loadPackageDefinition(def);
  }

  connect(): void {
    if (this.destroyed) return;
    const addr = `${this.host}:${this.port}`;
    console.log(`[gRPC] Connecting → ${addr}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const EventStream = (this.grpcProto as any).cow_event.EventStream;
    this.stub = new EventStream(
      addr,
      grpc.credentials.createInsecure(),
    ) as grpc.Client;

    this.stream = (this.stub as any).SubscribeCowEvents(
      {},
    ) as grpc.ClientReadableStream<RawCowEvent>;

    this.stream.on("data", (event: RawCowEvent) => {
      this.handleCowEvent(event);
    });

    this.stream.on("error", (err: Error) => {
      if (this.destroyed) return;
      console.error("[gRPC] Stream error:", err.message);
      this.scheduleReconnect();
    });

    this.stream.on("end", () => {
      if (this.destroyed) return;
      console.warn("[gRPC] Stream ended — reconnecting");
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    this.stream = null;
    try {
      this.stub?.close();
    } catch {}
    this.stub = null;

    console.log(`[gRPC] Reconnecting in ${this.reconnectDelay}ms`);
    setTimeout(() => {
      if (!this.destroyed) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
        this.connect();
      }
    }, this.reconnectDelay);
  }

  private handleCowEvent(event: RawCowEvent): void {
    const { module_name, event_name, contents } = event;

    try {
      if (module_name === "intent_book" && event_name === "IntentCreatedEvent") {
        const p = IntentCreatedEventBcs.parse(contents as unknown as Uint8Array);
        const relay: RelayEvent = {
          type: "INTENT_CREATED",
          data: {
            intent_id: p.intent_id,
            owner: p.owner,
            sell_type: p.sell_type.name,
            buy_type: p.buy_type.name,
            sell_amount: p.sell_amount.toString(),
            min_amount_out: p.min_amount_out.toString(),
            partial_fillable: p.partial_fillable,
            deadline: p.deadline.toString(),
          },
        };
        for (const h of this.handlers) h(relay);
      } else if (
        module_name === "intent_book" &&
        event_name === "IntentCancelledEvent"
      ) {
        const p = IntentCancelledEventBcs.parse(
          contents as unknown as Uint8Array,
        );
        const relay: RelayEvent = {
          type: "INTENT_CANCELLED",
          data: { intent_id: p.intent_id },
        };
        for (const h of this.handlers) h(relay);
      } else if (
        module_name === "settlement" &&
        event_name === "BatchOpenedEvent"
      ) {
        const p = BatchOpenedEventBcs.parse(contents as unknown as Uint8Array);
        const relay: RelayEvent = {
          type: "BATCH_OPENED",
          data: {
            batch_id: p.batch_id.toString(),
            auction_state_id: p.auction_state_id,
            intent_ids: p.intent_ids,
            commit_end_ms: p.commit_end_ms.toString(),
            execute_deadline_ms: p.execute_deadline_ms.toString(),
          },
        };
        for (const h of this.handlers) h(relay);
      } else if (
        module_name === "settlement" &&
        event_name === "WinnerSelectedEvent"
      ) {
        const p = WinnerSelectedEventBcs.parse(
          contents as unknown as Uint8Array,
        );
        const relay: RelayEvent = {
          type: "WINNER_SELECTED",
          data: {
            batch_id: p.batch_id.toString(),
            winner: p.winner,
            winner_score: p.winner_score.toString(),
          },
        };
        for (const h of this.handlers) h(relay);
      }
      // BatchAbortedEvent, SettlementCompleteEvent, FallbackTriggeredEvent ignored here
      // — solvers can subscribe with custom handlers if needed
    } catch (err) {
      console.error(
        `[gRPC] BCS decode error ${module_name}::${event_name}:`,
        err,
      );
    }
  }

  on(handler: (e: RelayEvent) => void): void {
    this.handlers.push(handler);
  }

  destroy(): void {
    this.destroyed = true;
    try {
      this.stream?.cancel();
    } catch {}
    try {
      this.stub?.close();
    } catch {}
  }
}
