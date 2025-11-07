#!/bin/bash
# Automated API Test Suite for Creator Split Paywall Backend
# Usage: ./test-api.sh [base_url]
# Example: ./test-api.sh http://localhost:3000

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0
TOTAL=0

# Test wallet address (can be any valid Ethereum address)
TEST_WALLET="0xbddb6c4fc08af549d13a33455374e7ffbfd7fa70"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Creator Split Paywall - API Test Suite${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Base URL: ${BASE_URL}\n"

# Helper function to run a test
run_test() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local expected_status="$4"
  local data="$5"
  
  TOTAL=$((TOTAL + 1))
  echo -e "${YELLOW}[TEST $TOTAL]${NC} $name"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${endpoint}" -H "Content-Type: application/json")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${endpoint}" -H "Content-Type: application/json" -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$http_code" == "$expected_status" ]; then
    echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    if [ ! -z "$body" ] && [ "$body" != "" ]; then
      echo "  Response: $(echo $body | head -c 100)..."
    fi
  else
    echo -e "  ${RED}✗ FAILED${NC} Expected $expected_status, got $http_code"
    FAILED=$((FAILED + 1))
    echo "  Response: $body"
  fi
  echo ""
}

# Test Suite

echo -e "${BLUE}--- Health Endpoints ---${NC}\n"

run_test "Health check" "GET" "/health" "200"
run_test "Liveness probe" "GET" "/health/live" "200"
run_test "Readiness probe" "GET" "/health/ready" "200"

echo -e "${BLUE}--- Blockchain Status ---${NC}\n"

run_test "Blockchain ingestion status" "GET" "/blockchain/status" "200"

echo -e "${BLUE}--- Subscription Endpoints ---${NC}\n"

run_test "Get subscription status" "GET" "/subscription/${TEST_WALLET}/status" "200"
run_test "Get subscription history" "GET" "/subscription/${TEST_WALLET}/history" "200"
run_test "Get subscription history with pagination" "GET" "/subscription/${TEST_WALLET}/history?page=1&limit=5" "200"
run_test "Get creator metrics (placeholder)" "GET" "/subscription/creator/test-creator/metrics" "200"

echo -e "${BLUE}--- Webhook Endpoints ---${NC}\n"

run_test "Post valid anomaly webhook" "POST" "/webhooks/anomalies" "201" \
  '{"type":"suspicious_pattern","severity":"high","description":"Test anomaly from automated test"}'

run_test "Post invalid anomaly webhook (missing severity)" "POST" "/webhooks/anomalies" "400" \
  '{"type":"unusual_volume","description":"Missing severity field"}'

run_test "Post invalid anomaly webhook (invalid severity)" "POST" "/webhooks/anomalies" "400" \
  '{"type":"rapid_subscription","severity":"INVALID","description":"Invalid severity value"}'

run_test "Post invalid anomaly webhook (forbidden extra field)" "POST" "/webhooks/anomalies" "400" \
  '{"type":"other","severity":"low","description":"Test","malicious":"extra-field"}'

echo -e "${BLUE}--- Edge Cases ---${NC}\n"

run_test "Invalid wallet address format" "GET" "/subscription/invalid-address/status" "200"
run_test "Non-existent endpoint" "GET" "/non-existent" "404"

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed! ✓${NC}\n"
  exit 0
else
  echo -e "\n${RED}Some tests failed! ✗${NC}\n"
  exit 1
fi
