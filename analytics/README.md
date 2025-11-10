# Analytics (Celery / Python)

Performs anomaly detection on subscription and payment data, then posts results to the backend webhook.

## Run

```bash
cd analytics
pip install -r requirements.txt
python celery_app.py
```

Ensure `.env` is set from `.env.example` and that backend is reachable.

## Detection Methods

- IQR (interquartile range)
- Z-Score
- Isolation Forest (sklearn)

Feature flags and thresholds:

- `USE_IQR`, `USE_ZSCORE`, `USE_ISO`
- `ANOMALY_DETECTION_THRESHOLD` (affects Isolation Forest contamination)
- `ZSCORE_THRESHOLD`, `IQR_MULTIPLIER`

## Scheduling

`celery_app.py` includes a periodic schedule (`SCHEDULE_MINUTES`) to run scans.

## Webhook Contract

Posts to `${BACKEND_BASE_URL}/webhooks/anomalies` with token `ANALYTICS_WEBHOOK_TOKEN`.
Use `analytics/test-webhook.sh` to verify contract end-to-end.

## Testing

If you add tests, run with:

```bash
pytest
```

## Troubleshooting

| Symptom            | Fix                                                          |
| ------------------ | ------------------------------------------------------------ |
| Too many anomalies | Increase thresholds or disable a rule flag.                  |
| Webhook 401        | Ensure `ANALYTICS_WEBHOOK_TOKEN` matches backend.            |
| Slow scans         | Reduce `MAX_ROWS_PER_SCAN` or expand `ANALYSIS_WINDOW_DAYS`. |
| Duplicate alerts   | Check `DEDUP_PREFIX` keys in Redis.                          |
