# ⚡ Quick Start Guide

## Prerequisites Completed ✅

- ✅ Dependencies installed (`npm install`)
- ✅ Test suite structure created
- ✅ Utility scripts ready

## Next Steps 🚀

### 1. Configure Environment (5 min)

```bash
cd test-e2e
cp .env.example .env
```

Edit `.env` with your values:

```env
# From backend/.env
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract deployment
CONTRACT_ADDRESS=0xYourProxyContractAddress

# Backend API
BACKEND_BASE_URL=http://localhost:3000

# Test wallet (needs Sepolia ETH)
TESTER_PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY

# Contract owner
OWNER_PRIVATE_KEY=0xYOUR_OWNER_PRIVATE_KEY

# Current config (verify in contract)
SUBSCRIPTION_PRICE_WEI=10000000000000000
SUBSCRIPTION_DURATION_SECONDS=2592000

# Local services
REDIS_URL=redis://localhost:6379/0

# Collaborators
PAYEE_1=0xCollaboratorAddress1
PAYEE_2=0xCollaboratorAddress2
```

**⚠️ Important**:

- Get test wallet private key from your Metamask/wallet
- Fund it with Sepolia ETH: https://sepoliafaucet.com/
- Recommended: 0.5 ETH for multiple test runs

### 2. Verify Backend Running (2 min)

```bash
# From project root
cd ../
docker compose ps

# Should show backend, postgres, redis, analytics-worker, analytics-beat all running
```

If not running:

```bash
docker compose up -d
```

### 3. Test Individual Utility (Optional - 3 min)

Test that everything is configured correctly:

```bash
# From test-e2e/
npm run subscribe -- --amount=0.01 --periods=1
```

Expected output:

```
🔗 Subscribing to contract...
✅ Transaction sent: 0x...
⏳ Waiting for confirmation...
✅ Mined in block 12345678

📊 Subscription Status:
  - Active: true
  - Start Time: 1699999999
  - End Time: 1702591999
  - Periods: 1
```

### 4. Run Full E2E Suite (20-30 min)

```bash
npm test
```

This will:

1. Run all 5 test scenarios
2. Measure performance metrics
3. Generate report in `reports/`

**⏰ Note**: Anomaly detection test may take up to 20 minutes (waiting for Celery Beat scan).

### 5. Review Results

Check the generated report:

```bash
# Latest report
ls -lt reports/ | head -1

# Open in VS Code
code reports/e2e-report-*.md
```

## Expected Timeline

| Test                 | Duration      | Description                      |
| -------------------- | ------------- | -------------------------------- |
| Single Period        | ~2 min        | Basic subscription flow          |
| Multiple Periods     | ~2 min        | Multi-period payment             |
| Tip Payment          | ~2 min        | Payment with excess              |
| Insufficient Payment | ~30 sec       | Error case (reverts immediately) |
| Anomaly Detection    | **15-20 min** | Wait for analytics scan          |

**Total**: ~25-30 minutes for full suite

## Quick Commands Reference

```bash
# Full test suite
npm test

# Individual utilities
npm run subscribe -- --amount=0.02 --periods=2
npm run release
npm run seed -- --price=0.015 --duration=86400
npm run reset

# Check backend logs
docker compose logs -f backend

# Check analytics logs
docker compose logs -f analytics-beat
docker compose logs -f analytics-worker

# Redis inspection
docker compose exec redis redis-cli
> KEYS an:wm:*
> KEYS an:dedupe:*
```

## Troubleshooting

### "Cannot connect to backend"

```bash
curl http://localhost:3000/health
# Should return 200 OK
```

### "Transaction failed"

```bash
# Check wallet balance
cast balance YOUR_TESTER_ADDRESS --rpc-url https://sepolia.infura.io/v3/YOUR_KEY

# Should have > 0.1 ETH
```

### "Anomaly not detected after 20 min"

```bash
# Check analytics beat schedule
docker compose logs analytics-beat | grep "Scheduler"

# Verify SCHEDULE_MINUTES in analytics/.env
cat ../analytics/.env | grep SCHEDULE_MINUTES

# Should be 15 minutes
```

### "Redis connection refused"

```bash
docker compose ps redis
# Should show "Up"

# Restart if needed
docker compose restart redis
```

## What Gets Tested? ✅

- ✅ On-chain event emission (SubscriptionPaid)
- ✅ Backend event ingestion (polling + DB write)
- ✅ API status endpoint (`GET /subscriptions/:address`)
- ✅ Multi-period calculation
- ✅ Tip handling (excess amounts)
- ✅ Error case (insufficient payment reverts)
- ✅ Anomaly detection (unusual amounts trigger alerts)
- ✅ Performance metrics (ingest/API/anomaly latency)

## Generated Artifacts

After running tests:

```
test-e2e/
└── reports/
    └── e2e-report-2025-01-09T14-30-45.md
```

Report includes:

- ✅ Pass/Fail/Skip status per test
- 📊 Performance metrics (ms)
- 🔍 Transaction hashes and block numbers
- ⚙️ Configuration snapshot
- 💡 Recommendations

## Next Actions After Success

1. ✅ Commit test suite to repository
2. ✅ Document any configuration changes needed
3. ✅ Add resilience tests (backend restart, RPC failure)
4. ✅ Integrate with CI/CD pipeline
5. ✅ Prepare mainnet migration checklist

---

**Ready to run?** Start with Step 1 (Configure Environment) above! 🚀
