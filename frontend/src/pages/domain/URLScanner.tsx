import { useState } from "react";
import { ScanURL, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function URLScanner() {
  const [result, setResult] = useState<domain.URLScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await ScanURL(input);
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
    await QueryAI(`Analyze this URL scan result and determine if it is malicious:\n${JSON.stringify(result, null, 2)}`);
  };

  return (
    <ToolPage
      title="URL Scanner"
      description="Phishing/malware detection, redirect chain, security headers"
      placeholder="https://example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="urlscanner"
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
                  <span className="result-label">Safe</span>
                  <span className="result-value">
                    <span className={`result-badge ${result.is_safe ? "success" : "danger"}`}>
                      {result.is_safe ? "Safe" : "Potentially Unsafe"}
                    </span>
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-label">Status Code</span>
                  <span className="result-value">{result.status_code || "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">VT Malicious</span>
                  <span className="result-value" style={{ color: result.vt_malicious > 0 ? "#FF3344" : "inherit" }}>
                    {result.vt_malicious}/{result.vt_total}
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-label">VT Suspicious</span>
                  <span className="result-value">{result.vt_suspicious}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Final URL</span>
                  <span className="result-value" style={{ fontSize: 11 }}>{result.final_url || result.url}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Content Type</span>
                  <span className="result-value">{result.content_type || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {result.redirect_chain?.length ? (
            <div className="result-card">
              <p className="result-card-title">Redirect Chain</p>
              {result.redirect_chain.map((url, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="result-badge info">{i + 1}</span>
                  <code className="result-value" style={{ fontSize: 12 }}>{url}</code>
                </div>
              ))}
            </div>
          ) : null}

          {result.security_headers && (
            <div className="result-card">
              <p className="result-card-title">Security Headers</p>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.security_headers).map(([header, value]) => (
                    <tr key={header}>
                      <td>{header}</td>
                      <td>
                        <span className={`result-badge ${value === "missing" ? "danger" : "success"}`}>
                          {value === "missing" ? "Missing" : "Present"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ToolPage>
  );
}
