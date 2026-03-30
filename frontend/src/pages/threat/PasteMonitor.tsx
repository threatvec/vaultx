import { useState } from "react";
import { CheckPastes, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { threat } from "../../../wailsjs/go/models";

export default function PasteMonitor() {
  const [result, setResult] = useState<threat.PasteMonitorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await CheckPastes(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const handleAI = async () => {
    if (!result?.found?.length) return;
    await QueryAI(`Analyze these paste site findings for "${result.query}" and assess leak severity:\n${JSON.stringify(result.found, null, 2)}`);
  };

  return (
    <ToolPage
      title="Paste Monitor"
      description="Search Pastebin and paste sites for mentions of email, domain, or keyword"
      placeholder="user@example.com or example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="pastemonitor"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div className="result-card">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className={`result-badge ${result.total > 0 ? "danger" : "success"}`} style={{ fontSize: 16, padding: "8px 16px" }}>
                {result.total} paste{result.total !== 1 ? "s" : ""} found
              </span>
              <span className="text-secondary" style={{ fontSize: 13 }}>
                for "{result.query}"
              </span>
            </div>
          </div>

          {result.found?.length > 0 && (
            <div className="result-card">
              <p className="result-card-title">Found Pastes</p>
              {result.found.map((paste, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <a
                      href={paste.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 13 }}
                    >
                      {paste.url}
                    </a>
                    <span className="result-badge danger">{paste.source}</span>
                  </div>
                  {paste.content && (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      {paste.content}
                    </p>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {paste.found_at ? new Date(paste.found_at).toLocaleString() : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.total === 0 && (
            <div className="result-card">
              <p style={{ color: "#00FF88" }}>No pastes found — no known leaks for this query</p>
            </div>
          )}
        </>
      )}
    </ToolPage>
  );
}
