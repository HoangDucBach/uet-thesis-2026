#!/usr/bin/env bash
# submit-test-intents.sh
# Test CoW matching: 2 intents ngược chiều nhau
#   Intent A: sell 0.006 SUI  → want ≥0.18 DEEP
#   Intent B: sell 0.2 DEEP   → want ≥0.0053 SUI

set -e

# ─── Config ───────────────────────────────────────────────────────────────────

PACKAGE_ID="0xc194623feceeff778d13edbf8d29a0c9f1a2f3146e01d358c050170746061045"
CLOCK="0x6"
GAS_BUDGET="20000000"

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
    '.[] | select(.data.type == $t and .data.content.fields.balance != "0") | .data.objectId' \
  | head -1)

if [ -z "$DEEP_COIN" ] || [ "$DEEP_COIN" = "null" ]; then
  echo "ERROR: Không có DEEP coin!"
  exit 1
fi

echo "DEEP coin object: $DEEP_COIN"

# ─── Intent A: sell 0.006 SUI → want DEEP ───────────────────────────────────
# mid = 29_460_000 → 1 SUI = 33.9 DEEP
# 0.006 SUI = 6_000_000 MIST
# expected DEEP = 6_000_000 * 1e9 / (29_460_000 * 1000) ≈ 203_666 units
# min DEEP (10% buffer) = 180_000 units

echo ""
echo ">>> Submitting Intent A: sell 0.006 SUI → want ≥180_000 units (0.18 DEEP)"

sui client ptb \
  --split-coins gas "[6000000]" \
  --assign sui_sell \
  --move-call "${PACKAGE_ID}::intent_book::create_intent" \
    "<${SUI_TYPE}, ${DEEP_TYPE}>" \
    sui_sell.0 \
    180000 \
    false \
    $DEADLINE \
    @$CLOCK \
  --gas-budget $GAS_BUDGET

echo "Intent A submitted OK"

# ─── Intent B: sell 0.2 DEEP → want SUI ──────────────────────────────────────
# 0.2 DEEP = 200_000 units (decimals=6)
# expected SUI = 200_000 * 29_460_000 * 1000 / 1e9 = 5_892_000 MIST
# min SUI (10% buffer) = 5_300_000 MIST

echo ""
echo ">>> Refreshing DEEP coin lookup..."
DEEP_COIN=$(sui client objects --json 2>/dev/null \
  | jq -r --arg t "0x2::coin::Coin<$DEEP_TYPE>" \
    '.[] | select(.data.type == $t and .data.content.fields.balance != "0") | .data.objectId' \
  | head -1)
echo "DEEP coin object: $DEEP_COIN"

echo ""
echo ">>> Submitting Intent B: sell 0.2 DEEP → want ≥5_300_000 MIST (0.0053 SUI)"

sui client ptb \
  --split-coins "@$DEEP_COIN" "[200000]" \
  --assign deep_sell \
  --move-call "${PACKAGE_ID}::intent_book::create_intent" \
    "<${DEEP_TYPE}, ${SUI_TYPE}>" \
    deep_sell.0 \
    5300000 \
    false \
    $DEADLINE \
    @$CLOCK \
  --gas-budget $GAS_BUDGET

echo "Intent B submitted OK"

echo ""
echo "=== Done! ==="
echo "Cost: 0.2 DEEP + 0.006 SUI + gas per run"
echo "Relayer detect IntentCreatedEvent → open_batch sau ≤5s"