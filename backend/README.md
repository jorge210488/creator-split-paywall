# Backend (NestJS API)

Responsible for:

- Ingesting on-chain events from the SubscriptionSplitPaywall proxy
- Exposing authenticated REST endpoints (subscriptions, payees, anomalies)
- Persisting state in Postgres and caching in Redis
- Receiving anomaly webhooks from `analytics/`

## Install & Run

```bash
cd backend
npm install
npm run start:dev
```

Env file: copy `.env.example` to `.env` and populate external secrets (RPC, CONTRACT_ADDRESS, JWT_SECRET).

## Event Ingestion

On startup, blockchain service:

1. Connects to `ETH_RPC_URL` (and optional `ETH_RPC_URL_FALLBACK` via FallbackProvider)
2. Determines start block from `CONTRACT_START_BLOCK` or uses last watermark / lookback window
3. Subscribes / polls for events with confirmation delay (`CONFIRMATIONS`)
4. Persists derived subscription and payout data

To replay missed blocks:

```bash
# Adjust lookback (temporary)
LOOKBACK_BLOCKS=5000
npm run start:dev
```

Or use runbook `RUNBOOK_INGESTION_RETRY.md`.

## ABI Updates

Copy regenerated ABI from `contracts` after upgrades:

```bash
cp ../contracts/artifacts/contracts/SubscriptionSplitPaywall.sol/SubscriptionSplitPaywall.json \
  src/blockchain/abi/subscription.abi.json
```

Restart service.

## Anomaly Webhooks

Analytics posts JSON to `/webhooks/anomalies` including type, score, rule. Persisted in `anomalies` table then exposed via API.
Token verified against `ANALYTICS_WEBHOOK_TOKEN`.

## Configuration Hotspots

| Variable               | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `CONTRACT_ADDRESS`     | Proxy address of UUPS contract                  |
| `CONTRACT_START_BLOCK` | Force ingestion start block (override lookback) |
| `LOOKBACK_BLOCKS`      | How far back to scan if no start block          |
| `POLL_INTERVAL`        | ms between polling cycles                       |
| `CONFIRMATIONS`        | Block confirmations before processing           |
| `ETH_RPC_URL_FALLBACK` | Resiliency provider                             |

## Testing

```bash
npm test
```

Includes unit + integration; ensure Postgres + Redis available (docker-compose recommended).

## Troubleshooting

| Issue                  | Action                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| High latency ingestion | Lower `POLL_INTERVAL` or confirmations.                                  |
| Event duplication      | Check watermark logic; ensure single instance or enable leader election. |
| ABI function not found | Regenerate ABI after upgrade.                                            |
| 401 on anomaly webhook | Confirm `ANALYTICS_WEBHOOK_TOKEN`.                                       |
| Cannot reach RPC       | Rotate provider key; see `RUNBOOK_RPC_OUTAGE.md`.                        |

## Upgrade Impact

After contract upgrade regenerate ABI and, if new events added, extend entity + ingestion mapping.
