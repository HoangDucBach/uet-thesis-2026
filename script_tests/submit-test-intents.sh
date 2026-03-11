#!/usr/bin/env bash
# submit-test-intents.sh
# Test CoW matching: 2 intents ngược chiều nhau (Scale-up: 0.5 SUI)
#   Intent A: sell 0.5 SUI    → want ≥ 15 DEEP
#   Intent B: sell 17 DEEP    → want ≥ 0.45 SUI

set -e

# ─── Config ───────────────────────────────────────────────────────────────────

PACKAGE_ID="0xa16493b1e55665a3ecfe3f3cce935a8bc56313691457d8fa8aaaabe02be19e19"
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

# ─── TÌM CỤC SUI TO NHẤT LÀM GAS ──────────────────────────────────────────────
BIGGEST_SUI=$(sui client gas --json | jq -r 'sort_by(.mistBalance | tonumber) | reverse | .[0].gasCoinId')
if [ -z "$BIGGEST_SUI" ] || [ "$BIGGEST_SUI" = "null" ]; then
  echo "ERROR: Không tìm thấy SUI nào trong ví để làm Gas!"
  exit 1
fi

# ─── Intent A: sell 0.5 SUI → want DEEP ───────────────────────────────────────
echo ""
echo ">>> Submitting Intent A: sell 0.5 SUI → want ≥ 15,000,000 units (15 DEEP)"
echo "Using Gas Coin: $BIGGEST_SUI"

# THÊM @ VÀO TRƯỚC BIẾN $BIGGEST_SUI
sui client ptb \
  --gas-coin "@$BIGGEST_SUI" \
  --split-coins gas "[500000000]" \
  --assign sui_sell \
  --move-call "${PACKAGE_ID}::intent_book::create_intent" \
    "<${SUI_TYPE}, ${DEEP_TYPE}>" \
    sui_sell.0 \
    15000000 \
    false \
    $DEADLINE \
    @$CLOCK \
  --gas-budget $GAS_BUDGET

echo "Intent A submitted OK"

# ─── TÌM CỤC DEEP TO NHẤT LÀM VỐN CHO INTENT B ────────────────────────────────
echo ""
echo ">>> Refreshing DEEP coin lookup..."
DEEP_COIN=$(sui client objects --json 2>/dev/null \
  | jq -r --arg t "0x2::coin::Coin<$DEEP_TYPE>" \
    '[.[] | select(.data.type == $t)] | sort_by(.data.content.fields.balance | tonumber) | reverse | .[0].data.objectId')

if [ -z "$DEEP_COIN" ] || [ "$DEEP_COIN" = "null" ]; then
  echo "ERROR: Không có DEEP coin! Hãy đảm bảo ví có ít nhất 17 DEEP."
  exit 1
fi
echo "Using DEEP coin object: $DEEP_COIN"

# ─── Intent B: sell 17 DEEP → want SUI ────────────────────────────────────────
echo ""
echo ">>> Submitting Intent B: sell 17 DEEP → want ≥ 450_000_000 MIST (0.45 SUI)"

BIGGEST_SUI_B=$(sui client gas --json | jq -r 'sort_by(.mistBalance | tonumber) | reverse | .[0].gasCoinId')

# THÊM @ VÀO TRƯỚC BIẾN $BIGGEST_SUI_B
sui client ptb \
  --gas-coin "@$BIGGEST_SUI_B" \
  --split-coins "@$DEEP_COIN" "[17000000]" \
  --assign deep_sell \
  --move-call "${PACKAGE_ID}::intent_book::create_intent" \
    "<${DEEP_TYPE}, ${SUI_TYPE}>" \
    deep_sell.0 \
    450000000 \
    false \
    $DEADLINE \
    @$CLOCK \
  --gas-budget $GAS_BUDGET

echo "Intent B submitted OK"

echo ""
echo "=== Done! ==="
echo "Relayer detect IntentCreatedEvent → open_batch sau ≤5s"