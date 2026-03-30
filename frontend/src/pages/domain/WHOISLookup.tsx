import { useState } from "react";
import { LookupWHOIS, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function WHOISLookup() {
  const [result, setResult] = useState<domain.WHOISResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await LookupWHOIS(input);
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
    await QueryAI(`Analyze this WHOIS data for ${result.domain} and highlight any security concerns:\n${JSON.stringify(result, null, 2)}`);
  };

  return (
    <ToolPage
      title="WHOIS Lookup"
      description="Domain registration, registrar, expiry, nameservers"
      placeholder="example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="whois"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div className="result-card">
            <p className="result-card-title">Registration Info</p>
            <div className="result-grid">
              {[
                ["Domain", result.domain],
                ["Registrar", result.registrar],
                ["Created", result.created_date],
                ["Updated", result.updated_date],
                ["Expires", result.expiry_date],
                ["Days Until Expiry", result.days_until_expiry?.toString()],
              ].map(([label, value]) => (
                <div key={label} className="result-row">
                  <span className="result-label">{label}</span>
                  <span className="result-value">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {result.nameservers?.length ? (
            <div className="result-card">
              <p className="result-card-title">Nameservers</p>
              {result.nameservers.map((ns, i) => (
                <div key={i} className="result-value" style={{ marginBottom: 4 }}>{ns}</div>
              ))}
            </div>
          ) : null}

          {result.status?.length ? (
            <div className="result-card">
              <p className="result-card-title">Status</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.status.map((s, i) => (
                  <span key={i} className="result-badge info">{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {result.raw_text && (
            <div className="result-card">
              <p className="result-card-title">Raw WHOIS</p>
              <pre style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {result.raw_text}
              </pre>
            </div>
          )}
        </>
      )}
    </ToolPage>
  );
}
