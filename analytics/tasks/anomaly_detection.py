import os
import logging
from datetime import datetime, timedelta
import psycopg2
import redis
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from celery import Task
import requests
from typing import List, Dict, Optional, Tuple

from celery_app import app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment configuration
DATABASE_URL = os.getenv('DATABASE_URL')
BACKEND_BASE_URL = os.getenv('BACKEND_BASE_URL', 'http://backend:3000')
ANALYTICS_WEBHOOK_TOKEN = os.getenv('ANALYTICS_WEBHOOK_TOKEN', 'super-secret')
SUBSCRIPTION_PRICE_WEI = int(os.getenv('SUBSCRIPTION_PRICE_WEI', '100000000000000000'))
ANOMALY_DETECTION_THRESHOLD = float(os.getenv('ANOMALY_DETECTION_THRESHOLD', '0.95'))
ANALYSIS_WINDOW_DAYS = int(os.getenv('ANALYSIS_WINDOW_DAYS', '30'))
IQR_MULTIPLIER = float(os.getenv('IQR_MULTIPLIER', '1.5'))
ZSCORE_THRESHOLD = float(os.getenv('ZSCORE_THRESHOLD', '3.0'))
ISO_MIN_SAMPLES = int(os.getenv('ISO_MIN_SAMPLES', '20'))
ALERT_TTL_SECONDS = int(os.getenv('ALERT_TTL_SECONDS', '604800'))
WATERMARK_KEY_BLOCK = os.getenv('WATERMARK_KEY_BLOCK', 'an:wm:block')
WATERMARK_KEY_LOG = os.getenv('WATERMARK_KEY_LOG', 'an:wm:log')
DEDUP_PREFIX = os.getenv('DEDUP_PREFIX', 'an:dup:')
MAX_ROWS_PER_SCAN = int(os.getenv('MAX_ROWS_PER_SCAN', '5000'))
WHITELIST_ADDRESSES = set(addr.strip().lower() for addr in os.getenv('WHITELIST_ADDRESSES', '').split(',') if addr.strip())
USE_IQR = os.getenv('USE_IQR', 'true').lower() == 'true'
USE_ZSCORE = os.getenv('USE_ZSCORE', 'true').lower() == 'true'
USE_ISO = os.getenv('USE_ISO', 'true').lower() == 'true'

# Redis connection
redis_client = redis.from_url(os.getenv('CELERY_BROKER_URL'))


def get_db_connection():
    """Create PostgreSQL connection"""
    return psycopg2.connect(DATABASE_URL)


def get_watermark() -> Tuple[int, int]:
    """Get last processed (block, logIndex) from Redis"""
    block = redis_client.get(WATERMARK_KEY_BLOCK)
    log = redis_client.get(WATERMARK_KEY_LOG)
    
    if block is None or log is None:
        logger.info("No watermark found, starting fresh")
        return 0, 0
    
    return int(block), int(log)


def set_watermark(block: int, log_index: int):
    """Update watermark in Redis"""
    redis_client.set(WATERMARK_KEY_BLOCK, block)
    redis_client.set(WATERMARK_KEY_LOG, log_index)
    logger.info(f"Watermark updated: block={block}, logIndex={log_index}")


def fetch_payments(last_block: int, last_log: int) -> pd.DataFrame:
    """
    Fetch new payments from database ordered by (blockNumber, logIndex)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # If watermark is 0, limit to ANALYSIS_WINDOW_DAYS
        if last_block == 0 and last_log == 0:
            cutoff_date = datetime.utcnow() - timedelta(days=ANALYSIS_WINDOW_DAYS)
            query = """
                SELECT 
                    p.id,
                    p.amount,
                    p.tx_hash as "txHash",
                    p.block_number as "blockNumber",
                    p.log_index as "logIndex",
                    p.timestamp,
                    w.address
                FROM payments p
                JOIN wallets w ON p.wallet_id = w.id
                WHERE p.timestamp >= %s
                ORDER BY p.block_number, p.log_index
                LIMIT %s
            """
            cursor.execute(query, (cutoff_date, MAX_ROWS_PER_SCAN))
        else:
            # Incremental: fetch only new payments after watermark
            query = """
                SELECT 
                    p.id,
                    p.amount,
                    p.tx_hash as "txHash",
                    p.block_number as "blockNumber",
                    p.log_index as "logIndex",
                    p.timestamp,
                    w.address
                FROM payments p
                JOIN wallets w ON p.wallet_id = w.id
                WHERE (p.block_number > %s) OR (p.block_number = %s AND p.log_index > %s)
                ORDER BY p.block_number, p.log_index
                LIMIT %s
            """
            cursor.execute(query, (last_block, last_block, last_log, MAX_ROWS_PER_SCAN))
        
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        df = pd.DataFrame(rows, columns=columns)
        logger.info(f"Fetched {len(df)} payments from database")
        
        return df
    finally:
        cursor.close()
        conn.close()


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add features for anomaly detection:
    - amountEth: amount in ETH
    - ratio: amount / SUBSCRIPTION_PRICE_WEI
    - delta_t: seconds between consecutive payments per address
    - batchCountForAddress: count of payments per address in this batch
    """
    if df.empty:
        return df
    
    # Convert amount to numeric (it may be string from DB)
    df['amountWei'] = pd.to_numeric(df['amount'], errors='coerce')
    df['amountEth'] = df['amountWei'] / 1e18
    df['ratio'] = df['amountWei'] / SUBSCRIPTION_PRICE_WEI
    
    # Normalize addresses to lowercase
    df['addressLower'] = df['address'].str.lower()
    
    # Calculate delta_t (time between consecutive payments per address)
    df = df.sort_values(['addressLower', 'timestamp'])
    df['timestamp_dt'] = pd.to_datetime(df['timestamp'])
    df['delta_t'] = df.groupby('addressLower')['timestamp_dt'].diff().dt.total_seconds()
    
    # Batch count per address
    df['batchCountForAddress'] = df.groupby('addressLower')['addressLower'].transform('count')
    
    # Sort back by block order
    df = df.sort_values(['blockNumber', 'logIndex'])
    
    logger.info(f"Features engineered: amountEth, ratio, delta_t, batchCountForAddress")
    
    return df


def detect_anomalies_iqr(df: pd.DataFrame) -> pd.DataFrame:
    """Detect anomalies using IQR method"""
    if not USE_IQR or df.empty or len(df) < 4:
        return pd.DataFrame()
    
    Q1 = df['amountWei'].quantile(0.25)
    Q3 = df['amountWei'].quantile(0.75)
    IQR = Q3 - Q1
    
    lower_bound = Q1 - IQR_MULTIPLIER * IQR
    upper_bound = Q3 + IQR_MULTIPLIER * IQR
    
    anomalies = df[(df['amountWei'] < lower_bound) | (df['amountWei'] > upper_bound)].copy()
    
    if not anomalies.empty:
        anomalies['rule'] = 'IQR'
        anomalies['score'] = np.abs((anomalies['amountWei'] - df['amountWei'].median()) / (IQR + 1e-9))
        logger.info(f"IQR detected {len(anomalies)} anomalies")
    
    return anomalies


def detect_anomalies_zscore(df: pd.DataFrame) -> pd.DataFrame:
    """Detect anomalies using Z-Score method"""
    if not USE_ZSCORE or df.empty or len(df) < 3:
        return pd.DataFrame()
    
    mean = df['amountWei'].mean()
    std = df['amountWei'].std()
    
    if std == 0:
        return pd.DataFrame()
    
    df['zscore'] = np.abs((df['amountWei'] - mean) / std)
    anomalies = df[df['zscore'] >= ZSCORE_THRESHOLD].copy()
    
    if not anomalies.empty:
        anomalies['rule'] = 'ZSCORE'
        anomalies['score'] = anomalies['zscore']
        logger.info(f"Z-Score detected {len(anomalies)} anomalies")
    
    return anomalies


def detect_anomalies_isolation_forest(df: pd.DataFrame) -> pd.DataFrame:
    """Detect anomalies using Isolation Forest"""
    if not USE_ISO or df.empty or len(df) < ISO_MIN_SAMPLES:
        logger.info(f"Isolation Forest skipped: {len(df)} samples (min: {ISO_MIN_SAMPLES})")
        return pd.DataFrame()
    
    # Prepare features for Isolation Forest
    features = df[['amountWei', 'ratio']].copy()
    features = features.fillna(0)
    
    contamination = max(0.01, 1.0 - ANOMALY_DETECTION_THRESHOLD)
    
    iso_forest = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100
    )
    
    predictions = iso_forest.fit_predict(features)
    scores = iso_forest.score_samples(features)
    
    # -1 indicates anomaly
    anomaly_mask = predictions == -1
    anomalies = df[anomaly_mask].copy()
    
    if not anomalies.empty:
        anomalies['rule'] = 'ISOLATION_FOREST'
        anomalies['score'] = np.abs(scores[anomaly_mask])
        logger.info(f"Isolation Forest detected {len(anomalies)} anomalies")
    
    return anomalies


def is_alert_sent(dedupe_key: str) -> bool:
    """Check if alert was already sent (idempotency)"""
    return redis_client.exists(dedupe_key) > 0


def mark_alert_sent(dedupe_key: str):
    """Mark alert as sent with TTL"""
    redis_client.setex(dedupe_key, ALERT_TTL_SECONDS, '1')


def remove_alert_mark(dedupe_key: str):
    """Remove alert mark (used when webhook fails)"""
    redis_client.delete(dedupe_key)


def send_webhook(alert: Dict) -> bool:
    """
    Send anomaly alert to backend webhook endpoint
    Returns True if successful, False otherwise
    """
    webhook_url = f"{BACKEND_BASE_URL}/webhooks/anomalies"
    headers = {
        'Content-Type': 'application/json',
        'X-ANALYTICS-TOKEN': ANALYTICS_WEBHOOK_TOKEN
    }
    
    try:
        response = requests.post(
            webhook_url,
            json=alert,
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 201, 204]:
            logger.info(f"Webhook sent successfully for {alert['dedupeKey']}")
            return True
        else:
            logger.error(f"Webhook failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Webhook exception: {e}")
        return False


def process_anomalies(anomalies: pd.DataFrame):
    """
    Process detected anomalies: dedupe, send webhook, mark as sent
    """
    if anomalies.empty:
        logger.info("No anomalies to process")
        return
    
    alerts_sent = 0
    
    for _, row in anomalies.iterrows():
        address_lower = row['addressLower']
        
        # Skip whitelisted addresses
        if address_lower in WHITELIST_ADDRESSES:
            logger.info(f"Skipping whitelisted address: {address_lower}")
            continue
        
        dedupe_key = f"{DEDUP_PREFIX}an:{row['txHash']}:{row['rule']}"
        
        # Check idempotency
        if is_alert_sent(dedupe_key):
            logger.debug(f"Alert already sent: {dedupe_key}")
            continue
        
        # Build alert payload
        alert = {
            'address': address_lower,
            'txHash': row['txHash'],
            'amountWei': str(int(row['amountWei'])),
            'blockNumber': int(row['blockNumber']),
            'logIndex': int(row['logIndex']),
            'rule': row['rule'],
            'score': float(row['score']),
            'dedupeKey': dedupe_key,
            'ts': datetime.utcnow().isoformat() + 'Z',
            'meta': {
                'amountEth': float(row['amountEth']),
                'ratio': float(row['ratio']),
                'delta_t': float(row.get('delta_t', 0)) if pd.notna(row.get('delta_t')) else None,
                'batchCountForAddress': int(row['batchCountForAddress'])
            }
        }
        
        # Send webhook
        if send_webhook(alert):
            mark_alert_sent(dedupe_key)
            alerts_sent += 1
        else:
            # Don't mark as sent if webhook fails - will retry on next scan
            logger.warning(f"Webhook failed for {dedupe_key}, will retry next scan")
    
    logger.info(f"Processed {alerts_sent} new anomaly alerts")


@app.task(bind=True, max_retries=3)
def scan_payments(self: Task):
    """
    Main task: Scan payments for anomalies and send alerts
    """
    logger.info("=" * 60)
    logger.info("Starting anomaly detection scan")
    logger.info("=" * 60)
    
    try:
        # 1. Get watermark
        last_block, last_log = get_watermark()
        logger.info(f"Current watermark: block={last_block}, logIndex={last_log}")
        
        # 2. Fetch new payments
        df = fetch_payments(last_block, last_log)
        
        if df.empty:
            logger.info("No new payments to process")
            return {'payments_processed': 0, 'alerts_sent': 0}
        
        # 3. Feature engineering
        df = engineer_features(df)
        
        # 4. Run anomaly detection (all methods in parallel)
        all_anomalies = []
        
        if USE_IQR:
            iqr_anomalies = detect_anomalies_iqr(df)
            if not iqr_anomalies.empty:
                all_anomalies.append(iqr_anomalies)
        
        if USE_ZSCORE:
            zscore_anomalies = detect_anomalies_zscore(df)
            if not zscore_anomalies.empty:
                all_anomalies.append(zscore_anomalies)
        
        if USE_ISO:
            iso_anomalies = detect_anomalies_isolation_forest(df)
            if not iso_anomalies.empty:
                all_anomalies.append(iso_anomalies)
        
        # Combine all anomalies
        if all_anomalies:
            combined_anomalies = pd.concat(all_anomalies, ignore_index=True)
            # Remove duplicates (same payment flagged by multiple rules - keep all rules)
            logger.info(f"Total anomalies detected (before dedupe): {len(combined_anomalies)}")
        else:
            combined_anomalies = pd.DataFrame()
        
        # 5. Process anomalies (send webhooks with dedupe)
        process_anomalies(combined_anomalies)
        
        # 6. Update watermark (only if successful)
        last_row = df.iloc[-1]
        new_block = int(last_row['blockNumber'])
        new_log = int(last_row['logIndex'])
        set_watermark(new_block, new_log)
        
        logger.info("=" * 60)
        logger.info(f"Scan complete: {len(df)} payments processed")
        logger.info("=" * 60)
        
        return {
            'payments_processed': len(df),
            'anomalies_detected': len(combined_anomalies) if not combined_anomalies.empty else 0,
            'last_block': new_block,
            'last_log': new_log
        }
        
    except Exception as e:
        logger.error(f"Scan failed with error: {e}", exc_info=True)
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
