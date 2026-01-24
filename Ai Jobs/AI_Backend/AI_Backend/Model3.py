#!/usr/bin/env python
# coding: utf-8

# In[1]:


# model3_platform_credibility.py
# Interface for Platform Credibility Model

def platform_credibility(platform_name: str) -> float:
    """
    Returns the credibility score (0–1) for a job posting platform.

    Args:
        platform_name (str): Platform name or URL

    Returns:
        float: Trust score between 0 and 1
    """

    if not platform_name:
        return 0.3

    platform_name = platform_name.lower().strip()

    platform_scores = {
        "linkedin": 0.95,
        "indeed": 0.90,
        "glassdoor": 0.85,
        "company website": 0.80,
        "monster": 0.75,
        "careerbuilder": 0.70,
        "facebook": 0.50,
        "instagram": 0.40,
        "telegram": 0.20,
        "whatsapp": 0.10
    }

    for key, score in platform_scores.items():
        if key in platform_name:
            return score

    return 0.30  # default fallback


# In[ ]:




