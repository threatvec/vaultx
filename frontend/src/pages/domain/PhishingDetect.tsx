import { useState } from "react";
import { AnalyzePhishing, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function PhishingDetect() {
  const [result, setResult] = useState<domain.PhishingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await AnalyzePhishing(input);
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
    await QueryAI(`Analyze this phishing detection result for ${result.domain} and assess risk:\n${JSON.stringify(result, null, 2)}`);
  };

  return (
    <ToolPage
      title="Phishing Detector"
      description="Typosquatting variants, homoglyph attacks, active domain check"
      placeholder="example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="phishing"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div className="result-card">
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div className="score-gauge">
                <div className={`score-circle ${result.risk_score >= 70 ? "high" : result.risk_score >= 30 ? "medium" : "low"}`}>
                  {result.risk_score}
                </div>
                <span className="text-secondary" style={{ fontSize: 12 }}>Risk Score</span>
              </div>
              <div className="result-grid" style={{ flex: 1 }}>
                <div className="result-row">
                  <span className="result-label">Domain</span>
                  <span className="result-value">{result.domain}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Total Variants</span>
                  <span className="result-value">{result.variants?.length || 0}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Active Variants</span>
                  <span className="result-value" style={{ color: result.active_count > 0 ? "#FF3344" : "inherit" }}>
                    {result.active_count}
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-label">Punycode/IDN</span>
                  <span className="result-value">
                    <span className={`result-badge ${result.is_punycode ? "warning" : "info"}`}>
                      {result.is_punycode ? "Yes" : "No"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {result.variants?.length ? (
            <div className="result-card">
              <p className="result-card-title">Variants ({result.variants.length})</p>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {result.variants.map((v, i) => (
                    <tr key={i}>
                      <td>{v.domain}</td>
                      <td><span className="result-badge info">{v.type}</span></td>
                      <td>
                        <span className={`result-badge ${v.active ? "danger" : "success"}`}>
                          {v.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{v.ip || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </ToolPage>
  );
}
