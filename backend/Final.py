#!/usr/bin/env python
# coding: utf-8

# In[1]:


# final_ensemble_model.py
# Final Ensemble Model (Production Interface)

from typing import Dict

# Model imports
from Model1 import get_description_fake_probability
from Model2 import assess_company_credibility
from Model3 import platform_credibility


def final_job_real_probability(
    description_fake_prob: float,
    company_credibility_score: float,
    platform_trust_score: float,
    weights: Dict[str, float] = None
) -> float:
    """
    Computes probability that a job posting is REAL.

    Returns:
        float (0–1)
    """

    if weights is None:
        weights = {
            "description": 0.4,
            "company": 0.4,
            "platform": 0.2
        }

    company_score_norm = company_credibility_score / 100.0
    description_real_prob = 1 - description_fake_prob

    prob_real = (
        weights["description"] * description_real_prob +
        weights["company"] * company_score_norm +
        weights["platform"] * platform_trust_score
    )

    return max(0.0, min(1.0, prob_real))


def analyze_job_post(
    job_post: Dict,
    company_name: str,
    platform_name: str,
    api_key: str,
    cse_id: str
) -> Dict:
    """
    Main entry point used by API / website.
    """

    # Model 1: Description
    description_fake_prob = get_description_fake_probability(job_post)

    # Model 2: Company credibility
    company_info = assess_company_credibility(company_name, api_key, cse_id)
    company_score = company_info["credibility_score"]

    # Model 3: Platform trust
    platform_score = platform_credibility(platform_name)

    # Final ensemble
    final_prob_real = final_job_real_probability(
        description_fake_prob,
        company_score,
        platform_score
    )

    return {
        "job_real_probability": round(final_prob_real, 2),
        "job_fake_probability": round(1 - final_prob_real, 2),
        "description_fake_probability": round(description_fake_prob, 2),
        "company_credibility_score": company_score,
        "platform_trust_score": platform_score,
        "company_details": company_info
    }


# In[ ]:




