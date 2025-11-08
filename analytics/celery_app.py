from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv
import os

load_dotenv()

app = Celery('analytics',
             broker=os.getenv('CELERY_BROKER_URL'),
             backend=os.getenv('CELERY_RESULT_BACKEND'),
             include=['tasks.anomaly_detection'])

# Beat schedule for periodic anomaly detection
schedule_minutes = int(os.getenv('SCHEDULE_MINUTES', 5))
app.conf.beat_schedule = {
    'scan-payments-for-anomalies': {
        'task': 'tasks.anomaly_detection.scan_payments',
        'schedule': schedule_minutes * 60.0,  # Convert to seconds
    },
}

app.conf.timezone = 'UTC'

if __name__ == '__main__':
    app.start()