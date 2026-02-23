#!/bin/bash

PACKAGE_PATH=${1:-.}

find "$PACKAGE_PATH" -name "Published.toml" -type f -delete

sui client publish "$PACKAGE_PATH" \
    --gas-budget 1000000000 \
    --doc \
    --json