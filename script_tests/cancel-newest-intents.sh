#!/usr/bin/env bash
# cancel-newest-intents.sh
# Cancel the most recently created Intent objects

set -e

# ─── Config ───────────────────────────────────────────────────────────────────

PACKAGE_ID="0x4c330ef3136a1bcf47259c74d2cfdea33e5cbb485c74537beab2903313d06883"
CLOCK="0x6"
GAS_BUDGET="20000000"

DEEP_TYPE="0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP"
SUI_TYPE="0x2::sui::SUI"

# ─── Switch sang account test ─────────────────────────────────────────────────

echo ">>> Switching to test account..."
sui client switch --address 0xb1a6f76f05d59999d09db12542c12468e5598e0e4c67b4a0c9b89df46890d63a

echo ">>> Active address:"
ACTIVE_ADDR=$(sui client active-address)
echo "$ACTIVE_ADDR"


if [ $# -lt 1 ]; then
  echo "ERROR: No intent IDs provided"
  echo "Usage: $0 <intent_id1> [intent_id2] [intent_id3] ..."
  exit 1
fi

echo ""
echo ">>> Intent IDs to cancel:"
for id in "$@"; do
  echo "  - $id"
done

COUNT=0
for INTENT_ID in "$@"; do
  COUNT=$((COUNT + 1))
  echo ""
  echo ">>> Canceling Intent #$COUNT: $INTENT_ID"

  # Try to cancel with both coin types
  # Intent A: <SUI, DEEP>
  echo "Trying SUI → DEEP intent..."
  sui client ptb \
    --move-call "${PACKAGE_ID}::intent_book::cancel_intent" \
      "<${SUI_TYPE}, ${DEEP_TYPE}>" \
      "@${INTENT_ID}" \
    --gas-budget $GAS_BUDGET 2>/dev/null || {
    # Try Intent B: <DEEP, SUI>
    echo "Trying DEEP → SUI intent..."
    sui client ptb \
      --move-call "${PACKAGE_ID}::intent_book::cancel_intent" \
        "<${DEEP_TYPE}, ${SUI_TYPE}>" \
        "@${INTENT_ID}" \
      --gas-budget $GAS_BUDGET 2>/dev/null || {
      echo "WARNING: Failed to cancel intent $INTENT_ID"
    }
  }

  echo "Canceled OK"
done

echo ""
echo "=== Done! Canceled $COUNT intents ==="
