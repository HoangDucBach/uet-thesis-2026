#!/usr/bin/env bash
# submit-test-minor-intents.sh

set -e

# ─── Config ───────────────────────────────────────────────────────────────────

PACKAGE_ID="0x4c330ef3136a1bcf47259c74d2cfdea33e5cbb485c74537beab2903313d06883"
CLOCK="0x6"
GAS_BUDGET="20000000"

DEEP_TYPE="0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP"
SUI_TYPE="0x2::sui::SUI"

DEADLINE=$(( $(date +%s) * 1000 + 300000 )) # 5 minutes


echo ">>> Switching to test account..."
sui client switch --address 0xb1a6f76f05d59999d09db12542c12468e5598e0e4c67b4a0c9b89df46890d63a

echo ">>> Active address:"
sui client active-address

BIGGEST_SUI=$(sui client gas --json | jq -r 'sort_by(.mistBalance | tonumber) | reverse | .[0].gasCoinId')
if [ -z "$BIGGEST_SUI" ] || [ "$BIGGEST_SUI" = "null" ]; then
  echo "ERROR: Không tìm thấy SUI nào trong ví để làm Gas!"
  exit 1
fi

# ─── Intent A: sell 0.5 SUI → want DEEP ───────────────────────────────────────
echo ""
echo ">>> Submitting Intent A: sell 0.000001 SUI (for minor intent)"
echo "Using Gas Coin: $BIGGEST_SUI"

sui client ptb \
  --gas-coin "@$BIGGEST_SUI" \
  --split-coins gas "[100]" \
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

echo ""
echo "=== Done! ==="