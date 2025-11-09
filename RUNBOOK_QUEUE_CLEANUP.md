# Runbook: Queue / Cache Cleanup

Use to clear Redis-based queues, watermarks, and deduplication keys.

## Redis Keys (analytics)
- `WATERMARK_KEY_BLOCK` (default: `an:wm:block`)
- `WATERMARK_KEY_LOG` (default: `an:wm:log`)
- `DEDUP_PREFIX` (default: `an:dup:`)

## Steps
1. Stop analytics and backend to avoid churn.
2. Connect to Redis and delete keys:
   ```bash
   redis-cli -u $REDIS_URL DEL an:wm:block an:wm:log
   redis-cli -u $REDIS_URL KEYS an:dup:* | xargs -r redis-cli -u $REDIS_URL DEL
   ```
3. Start backend first (to rebuild watermarks), then analytics.

## Verification
- Analytics logs show fresh scan with zero dedup hits.
- Backend ingestion proceeds without duplicate processing.
