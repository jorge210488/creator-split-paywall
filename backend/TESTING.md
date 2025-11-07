# Backend Testing & Operations Guide

## Automated Migrations on Startup

The backend now automatically runs database migrations when the Docker container starts.

**How it works:**

- `entrypoint.sh` executes `npm run typeorm:migrate:run` before starting the app
- If migrations fail, the app continues (with a warning) to avoid blocking startup
- Useful for fresh deployments or when pulling schema updates

**Manual migration commands** (if needed):

```bash
# Inside the container
docker compose exec backend npm run typeorm:migrate:run

# Or locally
npm run typeorm:migrate:run
```

---

## Blockchain Status Endpoint

Monitor blockchain ingestion health and metrics in real-time.

**Endpoint:** `GET /blockchain/status`

**Response example:**

```json
{
  "network": "sepolia",
  "contractAddress": "0xBcE442C1930e55fF097E3B5F8b1B372872925067",
  "rpcConnected": true,
  "lastProcessedBlock": 9575120,
  "currentBlock": 9575125,
  "confirmations": 3,
  "polling": true,
  "pollInterval": 15000,
  "eventsProcessed": 0
}
```

**Fields:**

- `rpcConnected`: Whether the RPC provider is reachable
- `lastProcessedBlock`: Last block the ingestion service processed
- `currentBlock`: Latest block from the network
- `polling`: Whether background polling is active
- `eventsProcessed`: Total `SubscriptionStarted` events ingested since startup

**Usage:**

```bash
curl http://localhost:3000/blockchain/status | jq
```

---

## Automated Test Suite

Comprehensive test script covering all API endpoints with pass/fail reporting.

**Location:** `backend/test-api.sh`

**What it tests:**

- ✓ Health endpoints (`/health`, `/health/live`, `/health/ready`)
- ✓ Blockchain status (`/blockchain/status`)
- ✓ Subscription queries (`/subscription/:address/status`, `/subscription/:address/history`)
- ✓ Webhook ingestion (valid and invalid payloads)
- ✓ Edge cases (invalid addresses, 404s)

**Run locally:**

```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

**Run against Docker:**

```bash
./test-api.sh http://localhost:3000
```

**Run against remote:**

```bash
./test-api.sh https://api.yourapp.com
```

**Expected output:**

```
======================================
Creator Split Paywall - API Test Suite
======================================
Base URL: http://localhost:3000

[TEST 1] Health check
  ✓ PASSED (HTTP 200)

[TEST 2] Liveness probe
  ✓ PASSED (HTTP 200)
...

======================================
Test Summary
======================================
Total Tests: 15
Passed: 15
Failed: 0

All tests passed! ✓
```

**CI/CD Integration:**
Exit code 0 = all passed, exit code 1 = failures detected.

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    docker compose up -d
    sleep 10
    cd backend && ./test-api.sh http://localhost:3000
```

---

## Quick Reference

### Start Backend with Migrations

```bash
docker compose up -d backend
docker compose logs -f backend  # Watch startup + migrations
```

### Check Ingestion Health

```bash
curl -s http://localhost:3000/blockchain/status | jq '.rpcConnected, .lastProcessedBlock'
```

### Run Full Test Suite

```bash
cd backend && ./test-api.sh
```

### Trigger Manual Migration

```bash
docker compose exec backend npm run typeorm:migrate:run
```

### Verify Processed Events Count

```bash
docker compose exec postgres psql -U admin -d creator_split_db -c "SELECT COUNT(*) FROM processed_events;"
```

---

## Troubleshooting

**Migrations fail on startup:**

- Check logs: `docker compose logs backend | grep -i migration`
- Verify `DATABASE_URL` in `.env.docker`
- Run manually: `docker compose exec backend npm run typeorm:migrate:run`

**Blockchain status shows `rpcConnected: false`:**

- Check `ETH_RPC_URL` in `.env.docker`
- Test RPC: `curl -X POST $ETH_RPC_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

**Test script shows FAILED:**

- Ensure backend is running: `docker compose ps`
- Check endpoint manually: `curl -i http://localhost:3000/health`
- Review backend logs for errors
