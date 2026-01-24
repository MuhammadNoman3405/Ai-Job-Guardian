#!/usr/bin/env python
# coding: utf-8

# In[1]:


# model1_description.py
# Interface for Job Description Fake Probability Model

import joblib
import pandas as pd
import re
from scipy.sparse import hstack
from sklearn.base import BaseEstimator, TransformerMixin

# ==============================
# Load trained artifacts
# ==============================
_description_model = joblib.load("fake_job_model.joblib")
_tfidf_vectorizer = joblib.load("tfidf_vectorizer.joblib")

# ==============================
# Text Preprocessor (same as training)
# ==============================
class TextPreprocessor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        text_cols = ['title', 'description', 'requirements', 'benefits', 'company_profile']

        for col in text_cols:
            X[col] = X[col].fillna('')

        X['combined_text'] = X[text_cols].apply(
            lambda row: ' '.join(row.values.astype(str)),
            axis=1
        )

        X['text_length'] = X['combined_text'].apply(len)

        def detect_salary_anomaly(text):
            if re.search(r'\$\s?[0-9]+', text) and re.search(
                r'\b(unlimited|weekly|daily)\b', text, re.IGNORECASE
            ):
                return 1
            return 0

        X['salary_anomaly_flag'] = X['combined_text'].apply(detect_salary_anomaly)

        return X[['combined_text', 'text_length', 'salary_anomaly_flag']]

_preprocessor = TextPreprocessor()

# ==============================
# Public Interface Function
# ==============================
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

    df = pd.DataFrame([job_post])

    X_processed = _preprocessor.transform(df)

    X_tfidf = _tfidf_vectorizer.transform(X_processed['combined_text'])

    X_final = hstack([
        X_tfidf,
        X_processed[['text_length', 'salary_anomaly_flag']].values
    ])

    prob_fake = _description_model.predict_proba(X_final)[:, 1][0]

    return float(prob_fake)


# In[ ]:




