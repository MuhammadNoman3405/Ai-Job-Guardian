# job_check_api.py (Vercel Serverless Ready)

import os
from dotenv import load_dotenv

# Load local env if present
load_dotenv(".env.local")
load_dotenv(".env")

API_KEY = os.getenv("GOOGLE_API_KEY")
CSE_ID = os.getenv("GOOGLE_CSE_ID")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from Final import final_job_real_probability, get_description_fake_probability
from Model2 import assess_company_credibility
from Model3 import platform_credibility

app = FastAPI(title="Job Credibility API")

# -----------------------------
# Add CORS middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Request Schema
# -----------------------------
class JobPost(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = ""
    benefits: Optional[str] = ""
    company_profile: Optional[str] = ""
    company_name: str
    platform_name: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "AI Job Guardian API",
        "version": "1.0.0",
        "platform": "Vercel Serverless"
    }

# -----------------------------
# API Endpoints (Support both /check_job and /api/check_job)
# -----------------------------
@app.post("/check_job")
@app.post("/api/check_job")
def check_job(job: JobPost):
    try:
        # Step 1: Description model
        description_fake_prob = get_description_fake_probability(job.dict())

        # Step 2: Company credibility
        company_info = assess_company_credibility(job.company_name, API_KEY, CSE_ID)
        company_credibility_score = company_info["credibility_score"]

        # Step 3: Platform credibility
        platform_trust_score = platform_credibility(job.platform_name)

        # Step 4: Final probability
        prob_real = final_job_real_probability(
            description_fake_prob,
            company_credibility_score,
            platform_trust_score
        )

        return {
            "description_fake_prob": round(description_fake_prob, 2),
            "company_credibility_score": company_credibility_score,
            "company_info": company_info,
            "platform_trust_score": platform_trust_score,
            "probability_job_real": round(prob_real, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
