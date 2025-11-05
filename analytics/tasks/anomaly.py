from celery_app import app
import numpy as np
from sklearn.ensemble import IsolationForest

@app.task
def detect_anomalies(subscription_data):
    """
    Detect anomalies in subscription payment patterns using Isolation Forest
    
    Args:
        subscription_data: List of subscription payment amounts and timestamps
        
    Returns:
        List of indices where anomalies were detected
    """
    X = np.array(subscription_data).reshape(-1, 1)
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    yhat = iso_forest.fit_predict(X)
    
    # Return indices where anomalies were detected (where yhat == -1)
    return [i for i, pred in enumerate(yhat) if pred == -1]