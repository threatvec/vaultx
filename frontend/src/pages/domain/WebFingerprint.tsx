import { useState } from "react";
import { FingerprintWeb, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function WebFingerprint() {
  const [result, setResult] = useState<domain.FingerprintResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await FingerprintWeb(input);
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
    await QueryAI(`Analyze this web fingerprint and identify potential security risks:\n${JSON.stringify(result, null, 2)}`);
  };

  const TechSection = ({ label, items }: { label: string; items: string[] }) => {
    if (!items?.length) return null;
    return (
      <div className="result-card">
        <p className="result-card-title">{label}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map((tech, i) => (
            <span key={i} className="result-badge info">{tech}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ToolPage
      title="Web Fingerprint"
      description="CMS/framework/CDN/analytics/server technology detection"
      placeholder="https://example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="fingerprint"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div className="result-card">
            <div className="result-grid">
              {result.server && (
                <div className="result-row">
                  <span className="result-label">Server</span>
                  <span className="result-value">{result.server}</span>
                </div>
              )}
              {result.powered_by && (
                <div className="result-row">
                  <span className="result-label">Powered By</span>
                  <span className="result-value">{result.powered_by}</span>
                </div>
              )}
            </div>
          </div>
          <TechSection label="CMS" items={result.cms} />
          <TechSection label="Frameworks" items={result.framework} />
          <TechSection label="CDN" items={result.cdn} />
          <TechSection label="Analytics & Tracking" items={result.analytics} />

          {result.headers && Object.keys(result.headers).length > 0 && (
            <div className="result-card">
              <p className="result-card-title">Response Headers</p>
              <table className="result-table">
                <thead>
                  <tr><th>Header</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {Object.entries(result.headers).slice(0, 30).map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{v}</td>
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
