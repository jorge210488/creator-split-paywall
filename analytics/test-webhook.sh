#!/bin/bash
# Simple test script to validate analytics -> backend anomaly webhook contract
# Usage: ./test-webhook.sh [backend_base_url]
# Example: ./test-webhook.sh http://localhost:3000

set -e

BACKEND_BASE_URL="${1:-http://localhost:3000}"
TOKEN="${ANALYTICS_WEBHOOK_TOKEN:-super-secret}"

echo "== Analytics Anomaly Webhook Contract Test =="
echo "Backend: $BACKEND_BASE_URL"

PAYLOAD=$(cat <<'JSON'
{
  "address": "0xbddb6c4fc08af549d13a33455374e7ffbfd7fa70",
  "txHash": "0xdeadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe",
  "amountWei": "123450000000000000",
  "blockNumber": 9999999,
  "logIndex": 12,
  "rule": "IQR",
  "score": 3.7,
  "dedupeKey": "an:test:deadbeef:IQR",
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "meta": {
    "amountEth": 0.12345,
    "ratio": 1.23,
    "delta_t": 456.7,
    "batchCountForAddress": 2
  }
}
JSON
)

echo "Sending webhook..."
HTTP_CODE=$(curl -s -o /tmp/resp.txt -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "X-ANALYTICS-TOKEN: $TOKEN" \
  -d "$PAYLOAD" \
  "$BACKEND_BASE_URL/webhooks/anomalies") || {
  echo "Request failed"; exit 1; }

BODY=$(cat /tmp/resp.txt)
rm /tmp/resp.txt

echo "Status: $HTTP_CODE"
echo "Body: $BODY"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook accepted"
  exit 0
else
  echo "❌ Unexpected status code"
  exit 1
fi
