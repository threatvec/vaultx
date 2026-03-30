import { useState } from "react";
import { LookupPhone, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { identity } from "../../../wailsjs/go/models";

export default function PhoneLookup() {
  const [result, setResult] = useState<identity.PhoneLookupResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await LookupPhone(input.trim());
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
    await QueryAI(`Analyze this phone number intelligence:\n${JSON.stringify(result, null, 2)}`);
  };

  return (
    <ToolPage
      title="Phone Lookup"
      description="Validate phone number — country, carrier, line type (requires AbstractAPI key)"
      placeholder="+1 (555) 123-4567 or +44 20 7946 0958"
      onQuery={handleQuery}
      loading={loading}
      toolName="phonelookup"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          {result.error ? (
            <div className="result-card">
              <p style={{ color: "#FFB800" }}>{result.error}</p>
            </div>
          ) : (
            <div className="result-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>📞</span>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
                    {result.international_format || result.number}
                  </div>
                  <div>
                    <span className={`result-badge ${result.valid ? "success" : "danger"}`}>
                      {result.valid ? "Valid" : "Invalid"}
                    </span>
                    {result.is_suspicious && (
                      <span className="result-badge warning" style={{ marginLeft: 6 }}>Suspicious Line Type</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="result-grid">
                {[
                  ["Country", result.country_name],
                  ["Country Code", result.country_code],
                  ["Location", result.location],
                  ["Carrier", result.carrier],
                  ["Line Type", result.line_type],
                  ["Local Format", result.local_format],
                  ["International Format", result.international_format],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label} className="result-row">
                      <span className="result-label">{label}</span>
                      <span className="result-value">{value}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </>
      )}
    </ToolPage>
  );
}
