#!/bin/bash

set -e

LOG_DIR="${LOG_DIR:-.}"
LOG_FILE="$LOG_DIR/sui-indexer.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

cleanup() {
    log "Shutting down..."
    if [ ! -z "$SIDECAR_PID" ]; then
        kill $SIDECAR_PID 2>/dev/null || true
        wait $SIDECAR_PID 2>/dev/null || true
    fi
    exit $?
}

trap cleanup SIGTERM SIGINT

# Source env
if [ ! -f .env ]; then
    error ".env file not found"
    exit 1
fi
source .env

log "=== Sui Indexer Production Start ==="

# Check binaries exist
if [ ! -f target/release/sidecar ]; then
    error "sidecar binary not found. Run: cargo build --release"
    exit 1
fi

if [ ! -f target/release/sui-indexer ]; then
    error "sui-indexer binary not found. Run: cargo build --release"
    exit 1
fi

log "Binaries OK"

# Reset database
log "Resetting database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
TRUNCATE TABLE transaction_digests;
TRUNCATE TABLE watermarks;
" 2>/dev/null || {
    error "Database reset failed"
    exit 1
}

log "Database reset OK"

# Get latest checkpoint
log "Fetching latest checkpoint from Sui testnet..."
LATEST_CHECKPOINT=$(curl -s -X POST https://fullnode.testnet.sui.io:443 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"sui_getLatestCheckpointSequenceNumber","params":[]}' \
    2>/dev/null | jq -r '.result')

if [ -z "$LATEST_CHECKPOINT" ] || [ "$LATEST_CHECKPOINT" == "null" ]; then
    error "Failed to fetch latest checkpoint"
    exit 1
fi

log "Latest checkpoint: $LATEST_CHECKPOINT"

# Start sidecar in background
log "Starting sidecar (port 50051)..."
target/release/sidecar >> "$LOG_FILE" 2>&1 &
SIDECAR_PID=$!
log "Sidecar PID: $SIDECAR_PID"

sleep 1

# Check sidecar is still running
if ! kill -0 $SIDECAR_PID 2>/dev/null; then
    error "Sidecar failed to start"
    exit 1
fi

log "Sidecar OK"

# Run indexer
log "Starting indexer (checkpoint: $LATEST_CHECKPOINT)..."
target/release/sui-indexer \
    --remote-store-url https://checkpoints.testnet.sui.io \
    --first-checkpoint $LATEST_CHECKPOINT \
    >> "$LOG_FILE" 2>&1

log "Indexer stopped"
cleanup
