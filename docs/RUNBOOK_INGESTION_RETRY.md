# Runbook: Re-ingest Missed Blocks

Use when events were missed due to downtime or RPC issues.

## Option A: Temporary Lookback

1. Stop backend.
2. Set `LOOKBACK_BLOCKS` to a sufficiently large number (e.g., 5000).
3. Start backend and allow catch-up.
4. Restore `LOOKBACK_BLOCKS` to normal.

## Option B: Force Start Block

1. Stop backend.
2. Set `CONTRACT_START_BLOCK=<last_confirmed_good_block>` in `.env`.
3. Start backend to reprocess from that height.

## Clean Up

- Ensure duplicates are handled idempotently by ingestion logic.
- Validate counts of events vs expected using Etherscan or your block explorer.
