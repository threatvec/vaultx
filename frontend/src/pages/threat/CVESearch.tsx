import { useState } from "react";
import { SearchCVE, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { threat } from "../../../wailsjs/go/models";

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
  NONE: "success",
};

export default function CVESearch() {
  const [result, setResult] = useState<threat.CVESearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await SearchCVE(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const handleAI = async () => {
    if (!result?.results?.length) return;
    await QueryAI(`Analyze these CVEs and prioritize which to fix first:\n${JSON.stringify(result.results.slice(0, 5), null, 2)}`);
  };

  return (
    <ToolPage
      title="CVE Search"
      description="NVD vulnerability database — search by CVE ID or software name"
      placeholder="CVE-2024-1234 or 'apache log4j'"
      onQuery={handleQuery}
      loading={loading}
      toolName="cvesearch"
      hasResult={!!result?.results?.length}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
            <span className="text-secondary" style={{ fontSize: 13 }}>
              {result.total} results found for "{result.query}"
            </span>
          </div>
          {result.results?.map((cve, i) => (
            <div key={i} className="result-card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 600, color: "var(--accent)" }}>
                    {cve.cve_id}
                  </span>
                  {cve.has_exploit && (
                    <span className="result-badge danger" style={{ marginLeft: 8 }}>
                      ⚡ Exploit Available
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {cve.severity && (
                    <span className={`result-badge ${SEVERITY_CLASS[cve.severity] || "info"}`}>
                      {cve.severity}
                    </span>
                  )}
                  {cve.cvss_v3_score > 0 && (
                    <span
                      className="result-badge"
                      style={{
                        background: cve.cvss_v3_score >= 9 ? "rgba(255,51,68,0.2)" : cve.cvss_v3_score >= 7 ? "rgba(255,184,0,0.2)" : "rgba(0,102,255,0.2)",
                        color: cve.cvss_v3_score >= 9 ? "#FF3344" : cve.cvss_v3_score >= 7 ? "#FFB800" : "#0066FF",
                      }}
                    >
                      CVSS {cve.cvss_v3_score.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                {cve.description}
              </p>

              <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)" }}>
                <span>Published: {cve.published?.substring(0, 10)}</span>
                <span>Modified: {cve.modified?.substring(0, 10)}</span>
                {cve.cvss_v3_vector && (
                  <code style={{ fontSize: 10 }}>{cve.cvss_v3_vector}</code>
                )}
              </div>

              {cve.has_exploit && cve.exploit_url && (
                <div style={{ marginTop: 8 }}>
                  <span className="result-label">Exploit URL: </span>
                  <code className="result-value" style={{ fontSize: 11 }}>{cve.exploit_url}</code>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </ToolPage>
  );
}
