import { useState, useEffect } from "react";
import { BarChart3, Loader2, Bot, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import {
  AnalyzeWithAI,
  GetAIProvider,
  GetQueryHistory,
} from "../../../wailsjs/go/main/App";

const TOOL_LABELS: Record<string, string> = {
  shadowscan: "ShadowScan",
  urlscanner: "URL Scanner",
  whoislookup: "WHOIS Lookup",
  dnsanalyzer: "DNS Analyzer",
  sslinspector: "SSL Inspector",
  httpheaders: "HTTP Headers",
  webfingerprint: "Web Fingerprint",
  phishing: "Phishing Detector",
  ipreputaton: "IP Reputation",
  cvesearch: "CVE Search",
  ipintelligence: "IP Intelligence",
  portscan: "Port Scanner",
  metadata: "Metadata Extractor",
  exif: "Image EXIF",
  hashlookup: "Hash Lookup",
  usernamesearch: "Username Search",
  emailbreach: "Email Breach",
  passwordanalyzer: "Password Analyzer",
  emailheader: "Email Header",
  pastemonitor: "Paste Monitor",
  osintdashboard: "OSINT Dashboard",
};

interface ScanEntry {
  tool: string;
  query: string;
  result: string;
  timestamp: string;
}

export default function AIRiskAnalysis() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [selectedScans, setSelectedScans] = useState<Set<number>>(new Set());
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScans, setLoadingScans] = useState(true);
  const [provider, setProvider] = useState("");

  useEffect(() => {
    GetAIProvider().then(setProvider).catch(() => {});
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    setLoadingScans(true);
    const tools = Object.keys(TOOL_LABELS);
    const allScans: ScanEntry[] = [];

    for (const tool of tools) {
      try {
        const history = await GetQueryHistory(tool, 5);
        if (history) {
          for (const h of history) {
            allScans.push({
              tool: h.Tool,
              query: h.Query,
              result: h.Result,
              timestamp: h.CreatedAt ? new Date(h.CreatedAt).toLocaleString() : "",
            });
          }
        }
      } catch {
        // skip
      }
    }

    // Sort by timestamp desc
    allScans.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    setScans(allScans.slice(0, 50));
    setLoadingScans(false);
  };

  const toggleScan = (idx: number) => {
    setSelectedScans((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedScans.size === scans.length) {
      setSelectedScans(new Set());
    } else {
      setSelectedScans(new Set(scans.map((_, i) => i)));
    }
  };

  const handleAnalyze = async () => {
    if (selectedScans.size === 0) return;
    setLoading(true);
    setAnalysis("");
    try {
      const selected = Array.from(selectedScans).map((i) => scans[i]);
      const dataStr = JSON.stringify(
        selected.map((s) => ({
          tool: TOOL_LABELS[s.tool] || s.tool,
          query: s.query,
          result: s.result.length > 2000 ? s.result.substring(0, 2000) + "..." : s.result,
        })),
        null,
        2
      );
      const result = await AnalyzeWithAI("Multiple Scans", dataStr);
      setAnalysis(result);
    } catch (err: any) {
      setAnalysis(`Error: ${err?.message || "AI analysis failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>AI Risk Analysis</h1>
            <p className="text-secondary">Select scan results and let AI evaluate your risk posture</p>
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

      {/* Recent scans list */}
      <div className="result-card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="result-card-title" style={{ margin: 0 }}>
            Recent Scan Results ({scans.length})
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={selectAll}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {selectedScans.size === scans.length ? "Deselect All" : "Select All"}
            </button>
            <button
              className="tool-scan-btn"
              onClick={handleAnalyze}
              disabled={loading || selectedScans.size === 0}
              style={{ fontSize: 12, padding: "4px 14px" }}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <BarChart3 size={13} /> Analyze {selectedScans.size > 0 ? `(${selectedScans.size})` : ""}
                </>
              )}
            </button>
          </div>
        </div>

        {loadingScans ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 20, justifyContent: "center" }}>
            <Loader2 size={16} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <span className="text-secondary" style={{ fontSize: 13 }}>Loading scan history...</span>
          </div>
        ) : scans.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30 }}>
            <Shield size={32} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
            <p className="text-muted" style={{ fontSize: 13 }}>
              No scan history found. Run some scans first, then come back for AI analysis.
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {scans.map((scan, i) => (
              <div
                key={i}
                onClick={() => toggleScan(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: selectedScans.has(i) ? "var(--accent)10" : "var(--bg-hover)",
                  border: `1px solid ${selectedScans.has(i) ? "var(--accent)40" : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `2px solid ${selectedScans.has(i) ? "var(--accent)" : "var(--text-muted)"}`,
                    background: selectedScans.has(i) ? "var(--accent)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selectedScans.has(i) && <CheckCircle size={12} style={{ color: "#000" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--accent)",
                        padding: "1px 8px",
                        borderRadius: 4,
                        background: "var(--accent)15",
                      }}
                    >
                      {TOOL_LABELS[scan.tool] || scan.tool}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{scan.query}</span>
                  </div>
                </div>
                <span className="text-muted" style={{ fontSize: 10, flexShrink: 0 }}>
                  {scan.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis result */}
      {(analysis || loading) && (
        <div className="result-card" style={{ marginTop: 16, borderColor: loading ? "var(--accent)30" : "var(--accent)40" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
            ) : (
              <Bot size={16} style={{ color: "var(--accent)" }} />
            )}
            <p className="result-card-title" style={{ margin: 0 }}>
              {loading ? "Analyzing..." : "AI Risk Analysis"}
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, justifyContent: "center" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span className="text-secondary">AI is analyzing your scan results...</span>
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                color: "var(--text)",
                fontFamily: "inherit",
              }}
            >
              {analysis}
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && scans.length > 0 && (
        <div className="tool-empty" style={{ marginTop: 32 }}>
          <AlertTriangle size={36} className="text-muted" />
          <p className="text-muted">Select scan results above and click Analyze</p>
        </div>
      )}
    </div>
  );
}
