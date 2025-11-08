#!/bin/bash
# Unified test runner for Creator Split Paywall
# Runs:
#  - Backend API tests
#  - Analytics webhook contract test
#  - (optional) Contracts tests when RUN_CONTRACTS=1
# Usage: ./scripts/test-all.sh [backend_base_url]

set -e

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_BASE_URL="${1:-http://localhost:3000}"

echo "=== Running unified test suite ==="
echo "Backend URL: $BACKEND_BASE_URL"

echo "--- Backend API tests ---"
pushd "$ROOT_DIR/backend" >/dev/null
./test-api.sh "$BACKEND_BASE_URL"
popd >/dev/null

echo "--- Analytics webhook test ---"
pushd "$ROOT_DIR/analytics" >/dev/null
./test-webhook.sh "$BACKEND_BASE_URL"
popd >/dev/null

if [ "${RUN_CONTRACTS:-0}" = "1" ]; then
  echo "--- Contracts tests ---"
  pushd "$ROOT_DIR/contracts" >/dev/null
  npm test --silent
  popd >/dev/null
else
  echo "(Skipping contracts tests; set RUN_CONTRACTS=1 to enable)"
fi

echo "✅ All selected test groups completed"
