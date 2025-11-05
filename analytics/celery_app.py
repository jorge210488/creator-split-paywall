from celery import Celery
from dotenv import load_dotenv
import os

load_dotenv()

app = Celery('analytics',
             broker=os.getenv('CELERY_BROKER_URL'),
             backend=os.getenv('CELERY_RESULT_BACKEND'),
             include=['tasks.anomaly'])

if __name__ == '__main__':
    app.start()