# Creator Split Paywall - E2E Test Suite

Comprehensive end-to-end testing suite for validating the complete payment flow on Sepolia testnet.

## 🎯 What It Tests

### Critical Scenarios

1. **Single Period Subscription** - Basic 1-period payment flow
2. **Multiple Periods** - 2x or more periods in one payment
3. **Payment with Tip** - Amount > exact multiple (excess as tip)
4. **Insufficient Payment** - Error handling for underpayment
5. **Anomaly Detection** - Unusual payment triggers analytics alert

### Performance Metrics

- **Ingest Latency** (t2 - t1): Time from tx mined to DB row
- **API Visibility** (t3 - t1): Time from tx mined to status active
- **Anomaly Latency** (t4 - t1): Time from tx mined to alert generated

## 📁 Structure

```
test-e2e/
├── scripts/
│   ├── utils.ts              # Shared utilities & config
│   ├── subscribe.ts          # Manual subscription tool
│   ├── release-payees.ts     # Trigger payee releases
│   ├── seed-config.ts        # Update contract config (owner)
│   ├── reset-state.ts        # Clear Redis watermarks
│   └── run-e2e.ts            # Main test orchestrator
├── fixtures/                 # Test data (future)
├── reports/                  # Generated test reports
├── package.json
├── tsconfig.json
└── .env                      # Configuration (copy from .env.example)
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd test-e2e
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_ADDRESS=0xYourProxyAddress
BACKEND_BASE_URL=http://localhost:3000
TESTER_PRIVATE_KEY=0xYourTestWalletPrivateKey
OWNER_PRIVATE_KEY=0xContractOwnerPrivateKey

SUBSCRIPTION_PRICE_WEI=10000000000000000
SUBSCRIPTION_DURATION_SECONDS=2592000

REDIS_URL=redis://localhost:6379/0

PAYEE_1=0xCollaboratorAddress1
PAYEE_2=0xCollaboratorAddress2
```

### 3. Fund Test Wallet

Ensure your tester wallet has Sepolia ETH:

- Get from [Sepolia Faucet](https://sepoliafaucet.com/)
- Recommended: 0.5 ETH for multiple test runs

## 🧪 Running Tests

### Full E2E Suite

```bash
npm test
```

This runs all test scenarios and generates a detailed Markdown report in `reports/`.

### Individual Utilities

**Subscribe manually:**

```bash
npm run subscribe -- --amount=0.01 --periods=1
```

**Release funds to collaborators:**

```bash
npm run release
```

**Update contract config (owner only):**

```bash
npm run seed -- --price=0.02 --duration=86400
```

**Reset analytics state:**

```bash
npm run reset
```

## 📊 Test Output

### Console Output

- Real-time progress for each test
- Transaction hashes and block numbers
- Performance metrics (ingest/API/anomaly latency)
- Pass/Fail/Skip status

### Generated Report

Located in `reports/e2e-report-<timestamp>.md`:

- Executive summary
- Detailed results per test
- Performance metrics
- Configuration snapshot
- Recommendations

Example metrics:

```
📊 Performance Metrics:
  - Ingest Latency: 2341ms (t2 - t1)
  - API Visibility: 4120ms (t3 - t1)
  - Anomaly Latency: 901234ms (t4 - t1)
```

## 🔍 Test Scenarios Explained

### 1. Single Period

- Pays exact `subscriptionPrice`
- Verifies event emission on-chain
- Confirms DB ingestion
- Validates API status endpoint
- Measures end-to-end latency

### 2. Multiple Periods

- Pays `n * subscriptionPrice`
- Verifies subscription duration extends correctly
- Confirms `periods = floor(amountWei / priceWei)`

### 3. Payment with Tip

- Pays `price + tip` (non-exact multiple)
- Verifies periods calculation
- Confirms excess handled gracefully

### 4. Insufficient Payment

- Attempts to pay less than `subscriptionPrice`
- **Expected**: Transaction reverts with `InsufficientPayment`
- Validates error handling

### 5. Anomaly Detection

- Sends unusual payment amount (e.g., 0.21 ETH)
- Waits for analytics Celery Beat scan (up to 20 min)
- Verifies anomaly appears in `/webhooks/anomalies`
- Measures detection latency

## 🛡️ Security Checklist

✅ Private keys only in `.env` (ignored by git)  
✅ Endpoints validated (address format, required fields)  
✅ Webhook protected by `X-ANALYTICS-TOKEN` header  
✅ Rate limiting configured in backend  
✅ CORS restricted in production

## 🔄 Resilience Testing (Future)

Planned tests for:

- Backend restart during tx processing
- RPC connection interruption
- Analytics worker restart
- Duplicate event handling

## 📝 Notes

- **Timing**: Anomaly detection may take up to 15 minutes (depending on `SCHEDULE_MINUTES`)
- **Gas**: Each test consumes ~0.01-0.05 ETH in gas + subscription price
- **Network**: Tests are designed for Sepolia; adjust config for mainnet simulation
- **Idempotency**: Reset state between runs if testing duplicate handling

## 🐛 Troubleshooting

**"Cannot find module 'ethers'"**

```bash
npm install
```

**"Insufficient funds"**

- Fund tester wallet with Sepolia ETH
- Check balance: `cast balance <address> --rpc-url <sepolia_url>`

**"Contract not deployed"**

- Verify `CONTRACT_ADDRESS` in `.env`
- Check deployment on [Sepolia Etherscan](https://sepolia.etherscan.io/)

**"Backend not responding"**

- Ensure backend is running: `docker compose ps`
- Check health: `curl http://localhost:3000/health`

**"Redis connection refused"**

- Start Redis: `docker compose up -d redis`
- Verify URL in `.env`

## 📚 Next Steps

1. Run full test suite on Sepolia
2. Review generated report
3. Fix any failing tests
4. Document deployment configuration
5. Prepare for mainnet migration

## 🤝 Contributing

When adding new tests:

1. Create test function in `run-e2e.ts`
2. Add timing measurements (t0-t4)
3. Calculate metrics with `calculateMetrics()`
4. Return `TestResult` with status/error/details
5. Update README with test description

---

**Last Updated**: 2025-11-09  
**Version**: 1.0.0  
**Network**: Sepolia Testnet
