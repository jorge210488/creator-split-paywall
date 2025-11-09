# Creator Split Paywall

[![CI](https://github.com/jorge210488/creator-split-paywall/actions/workflows/ci.yml/badge.svg)](https://github.com/jorge210488/creator-split-paywall/actions/workflows/ci.yml)
[![Deploy Sepolia](https://github.com/jorge210488/creator-split-paywall/actions/workflows/deploy-sepolia.yml/badge.svg)](https://github.com/jorge210488/creator-split-paywall/actions/workflows/deploy-sepolia.yml)
[![Release](https://img.shields.io/github/v/release/jorge210488/creator-split-paywall?label=release)](https://github.com/jorge210488/creator-split-paywall/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> A decentralized subscription paywall that automatically splits revenue among multiple payees while emitting rich on-chain + off-chain telemetry for analytics and anomaly detection.

---

## 1. High-Level Overview

The system consists of three cooperating components:

```
 ┌────────────────┐        Webhook + REST        ┌──────────────────────┐
 │  Analytics     │ ───────────────────────────▶ │      Backend (API)   │
 │  (Celery/Py)   │                             │  NestJS + Postgres    │
 │  - Periodic    │ ◀─────────────────────────── │  Redis (cache/queues) │
 │    anomaly scan│   Config / thresholds       └──────────┬───────────┘
 └───────┬────────┘                                        │
         │                                                 │ Events / Reads
         │  Anomaly Webhook                                │
         ▼                                                 ▼
 ┌────────────────────────────────────────────────────────────────┐
 │   SubscriptionSplitPaywall (UUPS Proxy)                       │
 │   - Subscription state + revenue split                       │
 │   - Upgradeable implementation (OpenZeppelin UUPS)           │
 └────────────────────────────────────────────────────────────────┘

             ▲                                        ▲
             │ Subscription create / renew            │ Payout / status queries
             │                                        │
         (End Users / Integrations / Frontend)  (Creator / Admin Panel)
```

Key Responsibilities:

- `contracts/` – Owns immutable logic boundaries (proxy + implementation) and payment split mathematics.
- `backend/` – Ingests on-chain events, exposes authenticated API, persists state & anomaly records, triggers business workflows.
- `analytics/` – Performs statistical + ML based anomaly detection over subscription/payment data and calls back via webhook.

---

## 2. Deployed Contract (Sepolia)

| Item                             | Address                                      |
| -------------------------------- | -------------------------------------------- |
| Proxy (SubscriptionSplitPaywall) | `0x5c617e061C00385Cc320E9a1Bcb9B2C433B213C9` |
| Current Implementation           | `0x104575F51DaCe0B6f3283d847530B48E96d52C3E` |
| Deployer                         | `0x5EEa7805E1920Ed024dBa8fC8c65A1fda2411fEB` |

Etherscan:

- Proxy: https://sepolia.etherscan.io/address/0x5c617e061C00385Cc320E9a1Bcb9B2C433B213C9#code
- Implementation: https://sepolia.etherscan.io/address/0x104575F51DaCe0B6f3283d847530B48E96d52C3E#code

Deployment metadata is stored at `contracts/deployments/sepolia.json` and is the source of truth for automation.

---

## 3. Repository Structure

```
contracts/      Hardhat project (UUPS proxy, scripts, tests, typechain)
backend/        NestJS API (event ingestion, roles, anomaly persistence, webhooks)
analytics/      Python Celery workers (scheduled anomaly detection & scoring)
infra/          Infra helpers (backups, etc.)
scripts/        Cross-cutting ops scripts (pg-backup, pg-restore, test orchestration)
test-e2e/       End-to-end test harness & env examples
docs/           Project documentation (runbooks, checklists, security)
```

Documentation index lives in `/docs`:

| File                               | Summary                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| `docs/SECURITY_ENV.md`             | Environment variable classification & handling guidelines.            |
| `docs/RUNBOOK_RPC_OUTAGE.md`       | Steps when primary RPC fails; switch fallback / rotate provider key.  |
| `docs/RUNBOOK_INGESTION_RETRY.md`  | Force re-ingestion of missed on-chain events (block range replay).    |
| `docs/RUNBOOK_QUEUE_CLEANUP.md`    | Clean Redis/Celery queues & anomaly dedup keys safely.                |
| `docs/RUNBOOK_ENV_RESET.md`        | Local environment reset (containers, volumes, caches, migrations).    |
| `docs/CHECKLIST_PRE_RELEASE.md`    | Verification before tagging a release (tests, migrations, gas, diff). |
| `docs/CHECKLIST_POST_RELEASE.md`   | Post-deploy validation & monitoring handoff.                          |
| `contracts/README.md`              | Contract architecture, UUPS upgrade flow, ABI regeneration, testing.  |
| `backend/README.md`                | API surface, ingestion process, configuration, troubleshooting.       |
| `analytics/README.md`              | Detection pipeline, threshold tuning, scheduling, feature flags.      |

---

## 4. Environment Variables – External Secrets to Obtain

These are the external secrets or credentials you must obtain (details and non-sensitive defaults are in each `.env.example`).

| Variable                             | Purpose                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| `ETH_RPC_URL` / `ETHEREUM_RPC_URL`   | Primary Ethereum RPC endpoint (Infura / Alchemy key).       |
| `ETH_RPC_URL_FALLBACK`               | Secondary RPC for resiliency.                               |
| `PRIVATE_KEY`                        | Deployer / signer key (keep separate from user funds).      |
| `ETHERSCAN_API_KEY`                  | Contract verification & source metadata.                    |
| `JWT_SECRET`                         | Auth token signing for backend API.                         |
| `ANALYTICS_WEBHOOK_TOKEN`            | Auth token for anomaly webhook from analytics → backend.    |
| `REDIS_URL`                          | External Redis when not using local docker default.         |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database credentials (if not using local compose defaults). |

Everything else can use defaults or non-sensitive overrides as per the applicable `.env.example` files.

---

## 5. Local Development – Full Project Startup

### Quick Start (All Services)

```bash
cp .env.example .env                # root env (optional base)
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env  # add ETHERSCAN_API_KEY if verifying
cp analytics/.env.example analytics/.env

docker-compose up --build           # launches postgres, redis, backend, analytics (if defined)

# In a separate terminal (if contracts dev):
cd contracts && npm install && npx hardhat compile && npx hardhat test

# Backend live reload:
cd backend && npm install && npm run start:dev

# (Optional) Frontend preview (placeholder)
# A simple mock UI can consume backend endpoints; for now use a simulated URL:
# https://dev.creator-split-paywall.example.com (replace with real frontend later)

# Analytics worker (if not launched via compose):
cd analytics && pip install -r requirements.txt && python celery_app.py
```

### End-to-End Test Harness

```bash
cp test-e2e/.env.example test-e2e/.env
bash scripts/test-all.sh http://localhost:3000
```

### Regenerating ABI for Backend

After modifying Solidity:

```bash
cd contracts
npx hardhat compile
# Copy fresh ABI:
cp artifacts/contracts/SubscriptionSplitPaywall.sol/SubscriptionSplitPaywall.json \
   ../backend/src/blockchain/abi/subscription.abi.json
```

### Contract Upgrade (UUPS)

1. Implement changes in `SubscriptionSplitPaywall.sol` ensuring storage layout safety (no reordering; append only).
2. Run tests & coverage: `npx hardhat test`.
3. Deploy new implementation + upgrade proxy:
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network sepolia   # if first deployment
   # For upgrade (create upgrade script or use console):
   npx hardhat console --network sepolia
   > const proxy = "0x5c617e061C00385Cc320E9a1Bcb9B2C433B213C9";
   > const NewImpl = await ethers.getContractFactory("SubscriptionSplitPaywall");
   > await upgrades.upgradeProxy(proxy, NewImpl);
   ```
4. Verify implementation: `npx hardhat run scripts/verify.ts --network sepolia`.
5. Update `contracts/deployments/sepolia.json` with the new implementation address.
6. Regenerate ABI (step above) and commit.

### Adjusting Anomaly Thresholds

Tune in `analytics/.env`:

- `ANOMALY_DETECTION_THRESHOLD` – Higher means stricter (fewer anomalies).
- `ZSCORE_THRESHOLD` – Raise to reduce noise from extreme but valid payments.
- `IQR_MULTIPLIER` – Controls sensitivity of IQR rule.
- Feature flags `USE_IQR`, `USE_ZSCORE`, `USE_ISO` to enable/disable detection strategies.
  Restart analytics worker after changes.

### Troubleshooting (Common Issues)

| Symptom                       | Fix                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Backend cannot connect to RPC | Ensure `ETH_RPC_URL` reachable; set fallback `ETH_RPC_URL_FALLBACK`.         |
| Events not ingesting          | Set `CONTRACT_START_BLOCK` or reduce `LOOKBACK_BLOCKS`; check confirmations. |
| ABI mismatch errors           | Regenerate ABI & restart backend.                                            |
| Anomaly webhook 401           | Verify `ANALYTICS_WEBHOOK_TOKEN` matches backend env.                        |
| Upgrade reverted              | Storage layout conflict; review OpenZeppelin upgrade safety guidelines.      |
| High anomaly noise            | Lower `ANOMALY_DETECTION_THRESHOLD` or disable a rule flag.                  |

---

## 6. Testing Strategy

Component scopes:

- `contracts/` – Unit tests for payment splitting, access control, upgrade safety.
- `backend/` – Unit + integration (API, ingestion, anomaly persistence).
- `analytics/` – Functional tests for detection algorithms.
- `test-e2e/` – Full subscription lifecycle and cross-component validation.

Run individually:

```bash
cd contracts && npm test
cd backend && npm test
cd analytics && pytest
```

Or orchestrated:

```bash
bash scripts/test-all.sh http://localhost:3000
```

---

## 7. Operational Runbooks & Checklists

See the root-level markdown files referenced earlier for full procedures:

- RPC outage, ingestion retry, queue cleanup, env reset.
- Pre-release & Post-release checklists.

Rollback Strategy (UUPS): retain previous implementation hash; if anomaly after upgrade, deploy hotfix or revert implementation using `upgrades.upgradeProxy(proxy, OldImplFactory)`.

---

## 8. Security & Secrets

Refer to `SECURITY_ENV.md` for classification and handling guidelines (no plaintext commits of production secrets; prefer platform secret managers in CI/CD).

---

## 9. Roadmap (Short)

- Frontend integration (creator/admin dashboard).
- Multi-network deployment (Polygon / Base).
- On-chain merkle claim variant for delayed revenue distribution.
- Adaptive anomaly model retraining pipeline.

---

## 10. License

MIT

---

## 11. Maintainers

CODEOWNERS designates repository owner (@jorge210488). For major changes open a Feature Request issue template first.

---

## 12. Handoff Guarantee

> With this README + referenced runbooks, a new engineer should be able to stand up a full local environment, run tests, and perform a safe proxy upgrade in under 30 minutes.
