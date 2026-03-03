#!/bin/bash

set -e

source .env

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
TRUNCATE TABLE transaction_digests;
TRUNCATE TABLE watermarks;
" 2>/dev/null || true

LATEST_CHECKPOINT=$(curl -s -X POST https://fullnode.testnet.sui.io:443 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"sui_getLatestCheckpointSequenceNumber","params":[]}' 2>/dev/null | jq -r '.result')

if [ -z "$LATEST_CHECKPOINT" ]; then
    exit 1
fi

# Start sidecar in background
cargo run --bin sidecar &
SIDECAR_PID=$!

# Run indexer
cargo run --bin sui-indexer -- --remote-store-url https://checkpoints.testnet.sui.io --first-checkpoint $LATEST_CHECKPOINT

# Cleanup sidecar on exit
kill $SIDECAR_PID 2>/dev/null || true
