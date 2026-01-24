


"use client";
import React, { useState } from "react";

const platforms = [
  "LinkedIn", "Indeed", "Glassdoor", "Company Website",
  "Monster", "CareerBuilder", "Facebook", "Instagram",
  "Telegram", "WhatsApp"
];

export default function JobDetector() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    companyName: "",
    companyType: "",
    platform: "LinkedIn",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const analyzeJob = async () => {
    if (!form.description || !form.title || !form.companyName)
      return alert("Please fill in all required fields!");

    setLoading(true);
    setResult(null);

    const data = {
      title: form.title,
      description: form.description,
      requirements: form.requirements,
      benefits: form.benefits,
      company_name: form.companyName,
      company_profile: form.companyType,
      platform_name: form.platform,
    };

    try {
      const response = await fetch("https://web-production-1203.up.railway.app/check_job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("API Error");
      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error(error);
      setResult({ error: "Backend server not connected or invalid response." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "40px" }}>
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#38bdf8" }}>🛡️ AI JOB GUARDIAN</h1>
          <p style={{ color: "#94a3b8" }}>Verify Job Postings from Any Platform Using Trained AI</p>
        </header>

        {/* Platform Selector */}
        <div style={{ marginBottom: "25px" }}>
          <p style={{ marginBottom: "12px", fontWeight: "600", color: "#64748b" }}>SELECT SOURCE PLATFORM:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setForm({ ...form, platform: p })}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: form.platform === p ? "2px solid #38bdf8" : "1px solid #334155",
                  backgroundColor: form.platform === p ? "#1e293b" : "transparent",
                  color: form.platform === p ? "#38bdf8" : "#94a3b8",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Fields */}
        <div style={{ display: "grid", gap: "15px" }}>
          <input
            name="title"
            placeholder="Job Title*"
            value={form.title}
            onChange={handleChange}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#f8fafc",
            }}
          />
          <textarea
            name="description"
            placeholder={`Paste job description or message from ${form.platform} here...`}
            value={form.description}
            onChange={handleChange}
            rows={5}
            style={{
              borderRadius: "8px",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "14px",
              resize: "none",
            }}
          />
          <input
            name="requirements"
            placeholder="Requirements (comma separated)"
            value={form.requirements}
            onChange={handleChange}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#f8fafc",
            }}
          />
          <input
            name="benefits"
            placeholder="Benefits (comma separated)"
            value={form.benefits}
            onChange={handleChange}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#f8fafc",
            }}
          />
          <input
            name="companyName"
            placeholder="Company Name*"
            value={form.companyName}
            onChange={handleChange}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#f8fafc",
            }}
          />
          <input
            name="companyType"
            placeholder="Company Type"
            value={form.companyType}
            onChange={handleChange}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#1e293b",
              color: "#f8fafc",
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={analyzeJob}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            marginTop: "20px",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#38bdf8",
            color: "#0f172a",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "AI IS ANALYZING..." : `CHECK JOB CREDIBILITY`}
        </button>

        {/* Results */}
        {result && (
          <div
            style={{
              marginTop: "30px",
              padding: "25px",
              borderRadius: "12px",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ color: "#38bdf8", marginBottom: "15px" }}>Detection Result</h3>

            {result.error ? (
              <p style={{ color: "#f87171" }}>{result.error}</p>
            ) : (
              <>
                <p><strong>Description Fake Probability:</strong> {(result.description_fake_prob * 100).toFixed(2)}%</p>
                <p><strong>Probability Job is Real:</strong> {(result.probability_job_real * 100).toFixed(2)}%</p>

                <hr style={{ borderColor: "#334155", margin: "15px 0" }} />

                <h4 style={{ color: "#38bdf8" }}>Company Information</h4>
                <p><strong>Company Name:</strong> {result.company_info?.company_name}</p>
                <p><strong>Credibility Score:</strong> {result.company_info?.credibility_score}</p>
                <p><strong>Status:</strong> {result.company_info?.status}</p>
                <p>
                  <strong>Website:</strong>{" "}
                  {result.company_info?.website_url ? (
                    <a href={result.company_info.website_url} target="_blank" style={{ color: "#38bdf8" }}>
                      {result.company_info.website_url}
                    </a>
                  ) : (
                    "Not found"
                  )}
                </p>
                <p>
                  <strong>LinkedIn:</strong>{" "}
                  {result.company_info?.linkedin_profile ? (
                    <a href={result.company_info.linkedin_profile} target="_blank" style={{ color: "#38bdf8" }}>
                      {result.company_info.linkedin_profile}
                    </a>
                  ) : (
                    "Not found"
                  )}
                </p>
                <p><strong>Number of Sources:</strong> {result.company_info?.num_sources}</p>

                <p><strong>Social Links:</strong></p>
                <ul>
                  {result.company_info?.social_links?.length > 0 ? (
                    result.company_info.social_links.map((link: string, i: number) => (
                      <li key={i}>
                        <a href={link} target="_blank" style={{ color: "#38bdf8" }}>{link}</a>
                      </li>
                    ))
                  ) : (
                    <li>No social links found</li>
                  )}
                </ul>

                <hr style={{ borderColor: "#334155", margin: "15px 0" }} />
                <p><strong>Platform Trust Score:</strong> {result.platform_trust_score * 100} %</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
