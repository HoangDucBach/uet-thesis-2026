# gRPC Sidecar Integration Guide

## Overview
The sidecar streams real-time COW events from the Sui indexer via gRPC Server Streaming on **port 50051**.

## Connection

**Address**: `localhost:50051` (or remote host:50051)

**Service**: `cow_event.EventStream`

**RPC**: `SubscribeCowEvents(Empty) returns (stream CowEvent)`

## Event Schema

```protobuf
message CowEvent {
  string package_id = 1;
  string module_name = 2;
  string event_name = 3;
  string tx_digest = 4;
  int64 checkpoint_seq = 5;
  int64 timestamp_ms = 6;
}
```

## Integration Examples

### Node.js/TypeScript
```typescript
import * as grpc from '@grpc/grpc-js';
import { EventStreamClient } from './proto/cow_event_grpc_pb';

const client = new EventStreamClient('localhost:50051', grpc.credentials.createInsecure());

const call = client.subscribeCowEvents({});
call.on('data', (event) => {
  console.log('COW Event:', event.toObject());
});

call.on('end', () => console.log('Stream ended'));
call.on('error', (err) => console.error('Stream error:', err));
```

### Python
```python
import grpc
from cow_event_pb2 import Empty
from cow_event_pb2_grpc import EventStreamStub

channel = grpc.aio.secure_channel('localhost:50051', grpc.ssl_channel_credentials())
stub = EventStreamStub(channel)

async for event in stub.SubscribeCowEvents(Empty()):
    print(f"COW Event: {event}")
```

### Go
```go
import "google.golang.org/grpc"
import "your-module/cow_event"

conn, _ := grpc.Dial("localhost:50051", grpc.WithInsecure())
client := cow_event.NewEventStreamClient(conn)

stream, _ := client.SubscribeCowEvents(context.Background(), &cow_event.Empty{})
for {
    event, _ := stream.Recv()
    fmt.Printf("COW Event: %+v\n", event)
}
```

## Setup

1. **Ensure Redis is running** on `REDIS_HOST:REDIS_PORT` (default: 54.81.114.69:6379)
2. **Run indexer + sidecar**:
   ```bash
   ./scripts/setup-and-run.sh
   ```
   This starts both services:
   - Indexer (emits events to Redis)
   - Sidecar (streams events via gRPC on :50051)

3. **Connect your consumer** to `localhost:50051`

## Event Filtering

The sidecar streams **ALL COW events** without filtering. Implement client-side filtering for:
- Specific `module_name` or `event_name`
- Transaction digest patterns
- Timestamp ranges
- etc.

## Error Handling

- Connection drops: Reconnect to sidecar endpoint
- Stream ends: Indexer or sidecar stopped
- Malformed events: Check Redis stream integrity with `redis-cli XLEN cow:events`
