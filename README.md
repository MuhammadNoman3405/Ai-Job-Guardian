# 🛡️ Ai-Job-Guardian: Intelligent Fraud Detection

**Ai-Job-Guardian** is an intelligent Machine Learning web application designed to identify and filter fraudulent job postings. By leveraging Natural Language Processing (NLP) and predictive ensemble modeling, this tool provides a safety layer for job seekers against online scams.

---

## 🚀 Project Goal
The primary objective is to classify job advertisements as either **Authentic** or **Fraudulent**. Using a dataset of over 18,000 descriptions, the model analyzes textual patterns and metadata across 10 platforms (LinkedIn, Indeed, Glassdoor, Telegram, WhatsApp, etc.) to protect users in the digital job market.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS
- **Backend & ML**: Next.js Serverless API Route + Python FastAPI (Vercel Serverless)
- **Machine Learning**: Scikit-learn TF-IDF + Logistic Regression Ensemble
- **External Intelligence**: Google Custom Search API (with automatic heuristic fallback)

---

## ⚡ Deploying to Vercel (1-Click Deployment)

You can deploy the entire full-stack application (frontend + ML backend) in a single Vercel project:

1. **Import the repository** into [Vercel](https://vercel.com).
2. In the deployment settings, configure:
   - **Root Directory**: `Ai Jobs/AI frontend`
   - **Framework Preset**: Next.js
3. *(Optional)* Add Environment Variables for live Google Company Search:
   - `GOOGLE_API_KEY`: Your Google Custom Search API key
   - `GOOGLE_CSE_ID`: Your Google Programmable Search Engine ID
   *(If not provided, the app uses smart domain heuristics automatically without crashing).*
4. Click **Deploy**. Your app is live with full ML detection capabilities!

---

## 🔗 Connect & Portfolio
- **Portfolio Website**: [Explore My Projects](https://my-portfolio-website-six-ashen.vercel.app)
- **LinkedIn**: [Connect with Muhammad Noman](https://www.linkedin.com/in/muhammad-noman-a219712b0/)

---
**Developed with ❤️ by Noman** *BSCS @ UET Taxila | Data Science & ML Enthusiast*
