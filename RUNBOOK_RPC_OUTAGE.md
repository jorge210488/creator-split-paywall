# Runbook: RPC Outage / Degradation

When the primary Ethereum RPC provider is down or unreliable.

## Symptoms
- Backend logs show provider errors / timeouts
- Health checks fail on chain-dependent endpoints
- Ingestion stalls

## Actions
1. Set fallback RPC in backend env:
   - `ETH_RPC_URL_FALLBACK=<alternate provider>`
2. Restart backend service (or redeploy container).
3. If both providers fail, temporarily increase `POLL_INTERVAL` and `CONFIRMATIONS` to reduce pressure.
4. Rotate to a new provider key (new project in Infura/Alchemy) if throttled.

## Verification
- Check `/health` endpoint on backend
- Observe resumed block polling in logs
- Confirm new anomalies/ingestion records are created
