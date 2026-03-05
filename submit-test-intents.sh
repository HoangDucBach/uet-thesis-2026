#!/usr/bin/env bash
# submit-test-intents.sh
# Test CoW matching: 2 intents ngược chiều nhau
#   Intent A: sell 2 DEEP  → want 0.09 SUI
#   Intent B: sell 0.1 SUI → want 1.8 DEEP

set -e

# ─── Config ───────────────────────────────────────────────────────────────────

PACKAGE_ID="0xad9e10e7e5822f7894112dae16e4aa0365e6357668e62a583eabc0c933d95614"
CLOCK="0x6"
GAS_BUDGET="10000000"

# Testnet DEEP coin type
DEEP_TYPE="0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP"
SUI_TYPE="0x2::sui::SUI"

# deadline = now + 5 phút (ms)
DEADLINE=$(( $(date +%s) * 1000 + 300000 ))

# ─── Switch sang account test ─────────────────────────────────────────────────

echo ">>> Switching to test account..."
sui client switch --address 0xb1a6f76f05d59999d09db12542c12468e5598e0e4c67b4a0c9b89df46890d63a

echo ">>> Active address:"
sui client active-address

echo ">>> Balance:"
sui client balance

# ─── Lấy DEEP coin object ─────────────────────────────────────────────────────

echo ""
echo ">>> DEEP coins owned:"
DEEP_COIN=$(sui client objects --json 2>/dev/null \
  | jq -r --arg t "0x2::coin::Coin<$DEEP_TYPE>" \
    '.[] | select(.data.type == $t) | .data.objectId' \
  | head -1)

if [ -z "$DEEP_COIN" ] || [ "$DEEP_COIN" = "null" ]; then
  echo "ERROR: Không có DEEP coin! Faucet DEEP trước:"
  echo "  Truy cập: https://deepbook.sui.io → faucet DEEP testnet"
  exit 1
fi

echo "DEEP coin object: $DEEP_COIN"

# ─── Intent A: sell 2 DEEP → want SUI ────────────────────────────────────────

echo ""
echo ">>> Submitting Intent A: sell 2 DEEP → want ≥0.09 SUI"

sui client ptb \
  --split-coins "@$DEEP_COIN" "[2000000]" \
  --assign deep_sell \
  --move-call "${PACKAGE_ID}::intent_book::create_intent" \
    "<${DEEP_TYPE}, ${SUI_TYPE}>" \
    deep_sell.0 \
    90000000 \
    false \
    $DEADLINE \
    @$CLOCK \
  --gas-budget $GAS_BUDGET

echo "Intent A submitted OK"

# ─── Intent B: sell 0.1 SUI → want DEEP ──────────────────────────────────────

echo ""
echo ">>> Submitting Intent B: sell 0.1 SUI → want ≥1.8 DEEP"

sui client ptb \
  --split-coins gas "[100000000]" \
  --assign sui_sell \
  --move-call "${PACKAGE_ID}::intent_book::create_intent" \
    "<${SUI_TYPE}, ${DEEP_TYPE}>" \
    sui_sell.0 \
    1800000 \
    false \
    $DEADLINE \
    @$CLOCK \
  --gas-budget $GAS_BUDGET

echo "Intent B submitted OK"

echo ""
echo "=== Done! 2 intents submitted ==="
echo "Relayer sẽ detect IntentCreatedEvent → buffer → open_batch_and_share sau ≤5s"
