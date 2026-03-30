import { useState } from "react";
import { GetHTTPHeaders, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function HTTPHeaders() {
  const [result, setResult] = useState<domain.URLScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await GetHTTPHeaders(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result.security_headers, null, 2));
  };

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze these HTTP security headers and provide recommendations:\n${JSON.stringify(result.security_headers, null, 2)}`);
  };

  return (
    <ToolPage
      title="HTTP Headers"
      description="CSP/HSTS/X-Frame security header analysis"
      placeholder="https://example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="httpheaders"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && result.security_headers && (
        <div className="result-card">
          <p className="result-card-title">Security Headers Analysis</p>
          {Object.entries(result.security_headers).map(([header, value]) => (
            <div key={header} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="result-label">{header}</span>
                <span className={`result-badge ${value === "missing" ? "danger" : "success"}`}>
                  {value === "missing" ? "Missing" : "Present"}
                </span>
              </div>
              {value !== "missing" && (
                <code className="result-value" style={{ fontSize: 11 }}>{value}</code>
              )}
            </div>
          ))}
        </div>
      )}
    </ToolPage>
  );
}
