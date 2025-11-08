#!/bin/bash
# End-to-end anomaly detection test:
# 1. Insert synthetic payment rows directly into Postgres
# 2. Trigger Celery scan via manual task call (using celery worker container exec) OR wait for beat
# 3. Query backend anomalies endpoint to confirm persistence
#
# Usage: ./scripts/test-anomaly-e2e.sh [backend_base_url] [postgres_container] [celery_worker_container]
# Defaults: backend_base_url=http://localhost:3000, postgres_container=creator-split-paywall-postgres-1, celery_worker_container=creator-split-paywall-analytics-worker-1

set -e

BACKEND_BASE_URL="${1:-http://localhost:3000}"
POSTGRES_CONTAINER="${2:-creator-split-paywall-postgres-1}"  # adjust if different naming
WORKER_CONTAINER="${3:-creator-split-paywall-analytics-worker-1}"  # adjust if different naming

echo "== E2E Anomaly Detection Test =="
echo "Backend: $BACKEND_BASE_URL"
echo "Postgres container: $POSTGRES_CONTAINER"
echo "Celery worker container: $WORKER_CONTAINER"

echo "[1/5] Inserting synthetic payments (wide distribution to trigger IQR & ZSCORE)"
SQL=$(cat <<'EOSQL'
INSERT INTO wallets (id, address, created_at, updated_at)
VALUES (gen_random_uuid(), '0xfeedfacefeedfacefeedfacefeedfacefeedface', now(), now())
ON CONFLICT (address) DO NOTHING;

WITH w AS (
  SELECT id FROM wallets WHERE address='0xfeedfacefeedfacefeedfacefeedfacefeedface'
)
INSERT INTO payments (id, wallet_id, amount, tx_hash, block_number, log_index, timestamp, created_at)
SELECT gen_random_uuid(), w.id,
       amt::text,
       '0x'||substr(md5(random()::text),1,60) as tx_hash,
       9999990 + seq as block_number,
       seq as log_index,
       now() - (interval '1 minute' * seq) as timestamp,
       now() as created_at
FROM w,
     (SELECT * FROM unnest(ARRAY[100000000000000000,200000000000000000,500000000000000000,900000000000000000,5,750000000000000000,3000000000000000000])) AS amt,
     generate_series(1,8) AS seq;
EOSQL
)

docker exec -i "$POSTGRES_CONTAINER" psql -U admin -d creator_split_db -c "$SQL"

echo "[2/5] Manually triggering Celery scan task (scan_payments)"
docker exec -i "$WORKER_CONTAINER" celery -A celery_app.app call tasks.anomaly_detection.scan_payments || {
  echo "Celery manual call failed; will wait for beat schedule instead";
  WAIT_FOR_BEAT=1;
}

if [ "$WAIT_FOR_BEAT" = "1" ]; then
  echo "[3/5] Waiting up to 90s for beat-triggered scan..."
  sleep 90
else
  echo "[3/5] Allowing 15s for task completion"
  sleep 15
fi

echo "[4/5] Querying anomalies (expect >=1)"
ANOMALIES_JSON=$(curl -s "$BACKEND_BASE_URL/anomalies?limit=5" || true)
echo "Response: $(echo "$ANOMALIES_JSON" | head -c 300)"

COUNT=$(echo "$ANOMALIES_JSON" | grep -o 'unusual_payment_amount' | wc -l | tr -d ' ')
if [ "$COUNT" -ge 1 ]; then
  echo "✅ Detected $COUNT anomaly record(s)"
else
  echo "❌ No anomalies detected; check worker logs and data distribution"
  exit 1
fi

echo "[5/5] Cleaning up synthetic payments (optional)"
docker exec -i "$POSTGRES_CONTAINER" psql -U admin -d creator_split_db -c "DELETE FROM payments WHERE block_number >= 9999990;" || true

echo "✅ E2E anomaly detection test completed successfully"
