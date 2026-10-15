# model1_description.py
# Interface for Job Description Fake Probability Model (Vercel Serverless Optimized)

import os
import re
import joblib
import numpy as np
from scipy.sparse import hstack

# Load trained artifacts relative to current file directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_description_model = joblib.load(os.path.join(BASE_DIR, "fake_job_model.joblib"))
_tfidf_vectorizer = joblib.load(os.path.join(BASE_DIR, "tfidf_vectorizer.joblib"))

def detect_salary_anomaly(text: str) -> int:
    if re.search(r'\$\s?[0-9]+', text) and re.search(
        r'\b(unlimited|weekly|daily)\b', text, re.IGNORECASE
    ):
        return 1
    return 0

def get_description_fake_probability(job_post: dict) -> float:
    """
    Args:
        job_post (dict): {
            title, description, requirements,
            benefits, company_profile
        }

    Returns:
        float: Probability (0–1) that description is FAKE
    """
    text_cols = ['title', 'description', 'requirements', 'benefits', 'company_profile']
    combined_text = ' '.join([str(job_post.get(col) or '') for col in text_cols])

    text_length = len(combined_text)
    salary_anomaly_flag = detect_salary_anomaly(combined_text)

    X_tfidf = _tfidf_vectorizer.transform([combined_text])
    extra_features = np.array([[text_length, salary_anomaly_flag]])
    X_final = hstack([X_tfidf, extra_features])

    prob_fake = _description_model.predict_proba(X_final)[:, 1][0]
    return float(prob_fake)
