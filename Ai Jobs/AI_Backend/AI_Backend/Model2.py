#!/usr/bin/env python
# coding: utf-8

# In[1]:


# model2_company_credibility.py
# Interface for Company Credibility Model (Inference Only)

import re
#from googleapiclient.discovery import build
from googleapiclient.discovery import build

# ==============================
# Internal Helpers
# ==============================

def _google_company_search(company_name, api_key, cse_id, num_results=10):
    """
    Search for a company's official website, LinkedIn, and social media pages
    using Google Custom Search API. Only LinkedIn + website are considered reliable.
    
    Returns:
        tuple: (website_url, linkedin_url, other_links)
    """
    service = build("customsearch", "v1", developerKey=api_key)
    res = service.cse().list(
        q=f"{company_name} official site OR LinkedIn OR Twitter OR Instagram OR YouTube OR Facebook",
        cx=cse_id,
        num=num_results
    ).execute()

    website_url = None
    linkedin_url = None
    other_links = []

    social_domains = ["facebook.com", "twitter.com", "instagram.com", "youtube.com"]

    for item in res.get("items", []):
        url = item["link"]
        url_lower = url.lower()

        # LinkedIn company page
        if "linkedin.com/company" in url_lower and not linkedin_url:
            linkedin_url = url

        # Social media pages
        elif any(social in url_lower for social in social_domains):
            other_links.append(url)

        # Candidate for official website
        else:
            domain = re.sub(r"https?://(www\.)?", "", url_lower).split("/")[0]
            company_words = [w.lower() for w in company_name.split() if len(w) > 2]  # ignore short words
            if all(word in domain for word in company_words):
                website_url = website_url or url
            else:
                other_links.append(url)

    return website_url, linkedin_url, other_links


# ==============================
# Public Interface Function
# ==============================
def assess_company_credibility(company_name: str,
                               api_key: str,
                               cse_id: str) -> dict:
    """
    Returns company credibility score (0–100) and metadata.
    """

    score = 0

    website, linkedin, other_links = _google_company_search(
        company_name, api_key, cse_id
    )

    num_sources = len([x for x in [website, linkedin] if x])

    # Website
    if website:
        score += 30
    else:
        score -= 10

    # LinkedIn
    if linkedin:
        score += 30

    # Social presence
    social_links = [
        link for link in other_links
        if any(s in link for s in ["facebook.com", "twitter.com", "instagram.com", "youtube.com"])
    ]
    num_social_links = len(social_links)

    if num_social_links >= 2:
        score += 25
    elif num_social_links == 1:
        score += 10
# else: 0 links → add nothing


    # Multiple sources
    if num_sources >= 3:
        score += 15

    score = max(0, min(score, 100))

    if score >= 70:
        status = "Credible"
    elif score >= 40:
        status = "Suspicious"
    else:
        status = "Fake / Highly Suspicious"

    return {
        "company_name": company_name,
        "credibility_score": score,
        "status": status,
        "website_url": website or None,
        "linkedin_profile": linkedin or None,
        "num_sources": num_sources,
        "social_links": social_links
    }


# In[ ]:




