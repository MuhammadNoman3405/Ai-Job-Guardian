# job_check_api.py

from dotenv import load_dotenv
import os

# Load local env if present
load_dotenv(".env.local")

API_KEY = os.getenv("GOOGLE_API_KEY")
CSE_ID = os.getenv("GOOGLE_CSE_ID")

if not API_KEY or not CSE_ID:
    raise RuntimeError("Missing Google API credentials")


from fastapi import FastAPI
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
    allow_origins=["*"],  # For development: allows all origins; in production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows headers like Content-Type
)

# -----------------------------
# Hardcoded Google API credentials
# -----------------------------


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

# -----------------------------
# API Endpoint
# -----------------------------
@app.post("/check_job")
def check_job(job: JobPost):
    # Step 1: Description model
    description_fake_prob = get_description_fake_probability(job.dict())

    # Step 2: Company credibility (use hardcoded keys)
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

# -----------------------------
# Run server: uvicorn job_check_api:app --reload
# -----------------------------
