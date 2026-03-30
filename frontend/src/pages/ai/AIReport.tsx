import { useState, useEffect } from "react";
import { FileBarChart, Loader2, Download, Bot, Copy, Check, RefreshCw } from "lucide-react";
import { GenerateWeeklyReport, GetAIProvider } from "../../../wailsjs/go/main/App";

export default function AIReport() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    GetAIProvider().then(setProvider).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setReport("");
    try {
      const r = await GenerateWeeklyReport();
      setReport(r);
    } catch (err: any) {
      setReport(`Error: ${err?.message || "Failed to generate report. Make sure an AI provider is configured."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `vaultx_weekly_report_${today}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noProvider = provider === "none" || provider === "";

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>AI Security Report</h1>
            <p className="text-secondary">
              Generate a comprehensive weekly security report from your scan history
            </p>
          </div>
          {provider && provider !== "none" && (
            <div
              style={{
                fontSize: 11,
                color: "var(--accent)",
                padding: "4px 10px",
                borderRadius: 20,
                background: "var(--accent)10",
                border: "1px solid var(--accent)30",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {provider}
            </div>
          )}
        </div>
      </div>

      {/* Generate button */}
      <div className="result-card" style={{ marginTop: 24, textAlign: "center" }}>
        <FileBarChart size={40} style={{ color: "var(--accent)", marginBottom: 12 }} />
        <h3 style={{ marginBottom: 8 }}>Weekly Security Report</h3>
        <p className="text-secondary" style={{ fontSize: 13, marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
          AI will analyze all your scan results from the past 7 days and generate a professional security report
          with risk assessment, key findings, and recommendations.
        </p>

        {noProvider && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#FFB80010",
              border: "1px solid #FFB80030",
              marginBottom: 16,
              fontSize: 13,
              color: "#FFB800",
            }}
          >
            ⚠️ No AI provider configured. Go to Settings to add an API key or install Ollama.
          </div>
        )}

        <button
          className="tool-scan-btn"
          onClick={handleGenerate}
          disabled={loading || noProvider}
          style={{ justifyContent: "center", width: "100%", maxWidth: 300, margin: "0 auto" }}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Generating Report...
            </>
          ) : (
            <>
              <RefreshCw size={15} /> Generate Weekly Report
            </>
          )}
        </button>
      </div>

      {/* Report output */}
      {(report || loading) && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
              ) : (
                <Bot size={16} style={{ color: "var(--accent)" }} />
              )}
              <p className="result-card-title" style={{ margin: 0 }}>
                {loading ? "Generating Report..." : "Generated Report"}
              </p>
            </div>
            {report && !loading && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                    color: copied ? "#00FF88" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleExport}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <Download size={12} /> Export .md
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span className="text-secondary">AI is analyzing your scan history and generating the report...</span>
              <span className="text-muted" style={{ fontSize: 12 }}>This may take 15-30 seconds</span>
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                color: "var(--text)",
                fontFamily: "inherit",
                maxHeight: "60vh",
                overflowY: "auto",
                padding: "0 4px",
              }}
            >
              {report}
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="tool-empty" style={{ marginTop: 32 }}>
          <FileBarChart size={40} className="text-muted" />
          <p className="text-muted">Click Generate to create your weekly report</p>
        </div>
      )}
    </div>
  );
}
