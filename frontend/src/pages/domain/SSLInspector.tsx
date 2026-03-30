import { useState } from "react";
import { InspectSSL, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function SSLInspector() {
  const [result, setResult] = useState<domain.SSLResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await InspectSSL(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze this SSL certificate for ${result.domain} and identify issues:\n${JSON.stringify(result, null, 2)}`);
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 50) return "warning";
    return "danger";
  };

  return (
    <ToolPage
      title="SSL Inspector"
      description="Certificate analysis, security score, expiry warning"
      placeholder="example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="ssl"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div className="result-card">
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div className="score-gauge">
                <div className={`score-circle ${getScoreClass(result.security_score)}`}>
                  {result.security_score}
                </div>
                <span className="text-secondary" style={{ fontSize: 12 }}>Security Score</span>
              </div>
              <div className="result-grid" style={{ flex: 1 }}>
                <div className="result-row">
                  <span className="result-label">Valid</span>
                  <span className="result-value">
                    <span className={`result-badge ${result.valid ? "success" : "danger"}`}>
                      {result.valid ? "Valid" : "Invalid"}
                    </span>
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-label">Protocol</span>
                  <span className="result-value">{result.protocol}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Subject</span>
                  <span className="result-value">{result.subject}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Issuer</span>
                  <span className="result-value">{result.issuer}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Cipher Suite</span>
                  <span className="result-value">{result.cipher_suite}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Days Until Expiry</span>
                  <span className={`result-value ${result.expiry_warning ? "" : ""}`}
                    style={{ color: result.expiry_warning ? "#FFB800" : "inherit" }}>
                    {result.days_until_expiry} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {result.sans?.length ? (
            <div className="result-card">
              <p className="result-card-title">Subject Alternative Names</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.sans.map((san, i) => (
                  <span key={i} className="result-badge info">{san}</span>
                ))}
              </div>
            </div>
          ) : null}

          {result.issues?.length ? (
            <div className="result-card">
              <p className="result-card-title" style={{ color: "#FF3344" }}>Issues</p>
              {result.issues.map((issue, i) => (
                <div key={i} className="result-badge danger" style={{ marginBottom: 6, display: "flex" }}>
                  {issue}
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </ToolPage>
  );
}
