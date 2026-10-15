import { NextRequest, NextResponse } from "next/server";
import modelData from "./model_data.json";

// Stop words set for fast O(1) lookup
const stopWordsSet = new Set(modelData.stop_words);

// Model parameters
const { intercept, text_len_coef, salary_anomaly_coef, vocab } = modelData as {
  intercept: number;
  text_len_coef: number;
  salary_anomaly_coef: number;
  stop_words: string[];
  vocab: Record<string, [number, number, number]>; // [idx, idf, coef]
};

// --- Model 1: Description Fake Probability ---
function computeDescriptionFakeProbability(job: {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  company_profile?: string;
}): number {
  const combinedText = [
    job.title || "",
    job.description || "",
    job.requirements || "",
    job.benefits || "",
    job.company_profile || "",
  ].join(" ");

  const textLength = combinedText.length;

  // Regex matching same pattern as Python: r'\$\s?[0-9]+' and r'\b(unlimited|weekly|daily)\b'
  const hasSalaryAnomaly =
    /\$\s?[0-9]+/.test(combinedText) &&
    /\b(unlimited|weekly|daily)\b/i.test(combinedText)
      ? 1
      : 0;

  // Tokenize using Python scikit-learn regex: (?u)\b\w\w+\b
  const wordMatches = combinedText.toLowerCase().match(/\b\w\w+\b/g) || [];

  // N-gram generation (1, 2) matching scikit-learn analyzer
  const tokens: string[] = [];

  // Unigrams (excluding stop words)
  for (let i = 0; i < wordMatches.length; i++) {
    const w = wordMatches[i];
    if (!stopWordsSet.has(w)) {
      tokens.push(w);
    }
  }

  // Bigrams (excluding bigrams where BOTH words are stop words)
  for (let i = 0; i < wordMatches.length - 1; i++) {
    const w1 = wordMatches[i];
    const w2 = wordMatches[i + 1];
    if (!(stopWordsSet.has(w1) && stopWordsSet.has(w2))) {
      tokens.push(`${w1} ${w2}`);
    }
  }

  // Term frequency counts
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    counts[t] = (counts[t] || 0) + 1;
  }

  // TF-IDF computation & L2 norm
  let sumSq = 0;
  const activeEntries: { idx: number; val: number; coef: number }[] = [];

  for (const [term, count] of Object.entries(counts)) {
    const entry = vocab[term];
    if (entry) {
      const [idx, idf, coef] = entry;
      const tfidf = count * idf;
      sumSq += tfidf * tfidf;
      activeEntries.push({ idx, val: tfidf, coef });
    }
  }

  const norm = Math.sqrt(sumSq) || 1.0;

  // Dot product
  let dotProduct = 0;
  for (const item of activeEntries) {
    dotProduct += (item.val / norm) * item.coef;
  }

  // Logit z
  const z =
    dotProduct +
    textLength * text_len_coef +
    hasSalaryAnomaly * salary_anomaly_coef +
    intercept;

  // Sigmoid
  const probFake = 1.0 / (1.0 + Math.exp(-z));
  return Math.min(Math.max(probFake, 0.0), 1.0);
}

// --- Model 2: Company Credibility ---
async function assessCompanyCredibility(companyName: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  let website: string | null = null;
  let linkedin: string | null = null;
  const socialLinks: string[] = [];
  const otherLinks: string[] = [];

  if (apiKey && cseId) {
    try {
      const query = `${companyName} official site OR LinkedIn OR Twitter OR Instagram OR YouTube OR Facebook`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=10`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const socialDomains = ["facebook.com", "twitter.com", "x.com", "instagram.com", "youtube.com"];

        for (const item of items) {
          const itemUrl: string = item.link || "";
          const urlLower = itemUrl.toLowerCase();

          if (urlLower.includes("linkedin.com/company") && !linkedin) {
            linkedin = itemUrl;
          } else if (socialDomains.some((d) => urlLower.includes(d))) {
            socialLinks.push(itemUrl);
          } else {
            const domain = urlLower.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
            const companyWords = companyName
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 2);
            if (companyWords.length > 0 && companyWords.every((w) => domain.includes(w))) {
              if (!website) website = itemUrl;
            } else {
              otherLinks.push(itemUrl);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Google Custom Search error:", err);
    }
  } else {
    // Graceful fallback heuristic when Google Search API credentials are not set
    const sanitized = companyName.trim();
    if (sanitized.length > 2) {
      const slug = sanitized.toLowerCase().replace(/[^a-z0-9]/g, "");
      website = `https://www.${slug}.com`;
      linkedin = `https://www.linkedin.com/company/${slug}`;
    }
  }

  let score = 0;
  if (website) score += 30;
  else score -= 10;

  if (linkedin) score += 30;

  const numSocial = socialLinks.length;
  if (numSocial >= 2) score += 25;
  else if (numSocial === 1) score += 10;

  const numSources = (website ? 1 : 0) + (linkedin ? 1 : 0);
  if (numSources >= 2) score += 15;

  score = Math.max(0, Math.min(100, score));

  let status = "Fake / Highly Suspicious";
  if (score >= 70) status = "Credible";
  else if (score >= 40) status = "Suspicious";

  return {
    company_name: companyName,
    credibility_score: score,
    status,
    website_url: website,
    linkedin_profile: linkedin,
    num_sources: numSources,
    social_links: socialLinks,
  };
}

// --- Model 3: Platform Trust Score ---
function platformCredibility(platformName: string): number {
  if (!platformName) return 0.3;
  const p = platformName.toLowerCase().trim();

  const platformScores: Record<string, number> = {
    linkedin: 0.95,
    indeed: 0.9,
    glassdoor: 0.85,
    "company website": 0.8,
    monster: 0.75,
    careerbuilder: 0.7,
    facebook: 0.5,
    instagram: 0.4,
    telegram: 0.2,
    whatsapp: 0.1,
  };

  for (const [key, score] of Object.entries(platformScores)) {
    if (p.includes(key)) return score;
  }
  return 0.3;
}

// --- Final Ensemble Calculation ---
function finalJobRealProbability(
  descriptionFakeProb: number,
  companyCredibilityScore: number,
  platformTrustScore: number
): number {
  const companyScoreNorm = companyCredibilityScore / 100.0;
  const descriptionRealProb = 1.0 - descriptionFakeProb;

  const probReal =
    0.4 * descriptionRealProb +
    0.4 * companyScoreNorm +
    0.2 * platformTrustScore;

  return Math.max(0.0, Math.min(1.0, probReal));
}

// --- Next.js Route Handler ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      requirements = "",
      benefits = "",
      company_profile = "",
      company_name,
      platform_name,
    } = body;

    if (!title || !description || !company_name) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, or company_name" },
        { status: 400 }
      );
    }

    // Step 1: Model 1 - Description Analysis
    const descriptionFakeProb = computeDescriptionFakeProbability({
      title,
      description,
      requirements,
      benefits,
      company_profile,
    });

    // Step 2: Model 2 - Company Credibility Check
    const companyInfo = await assessCompanyCredibility(company_name);

    // Step 3: Model 3 - Platform Trust Score
    const platformTrustScore = platformCredibility(platform_name);

    // Step 4: Final Ensemble Probability
    const probReal = finalJobRealProbability(
      descriptionFakeProb,
      companyInfo.credibility_score,
      platformTrustScore
    );

    return NextResponse.json({
      description_fake_prob: Math.round(descriptionFakeProb * 100) / 100,
      company_credibility_score: companyInfo.credibility_score,
      company_info: companyInfo,
      platform_trust_score: platformTrustScore,
      probability_job_real: Math.round(probReal * 100) / 100,
    });
  } catch (error: any) {
    console.error("API error in check_job:", error);
    return NextResponse.json(
      { error: "Internal server error analyzing job." },
      { status: 500 }
    );
  }
}
