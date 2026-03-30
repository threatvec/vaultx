import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Loader2, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink, Download } from "lucide-react";
import { RunOSINTDashboard, QueryAI } from "../../../wailsjs/go/main/App";
import { EventsOn, BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import type { identity } from "../../../wailsjs/go/models";

const RISK_COLORS: Record<string, string> = {
  critical: "#FF3344",
  high: "#FF6633",
  medium: "#FFB800",
  low: "#00FF88",
};

export default function OSINTDashboard() {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<identity.OSINTDashboardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveModules, setLiveModules] = useState<identity.OSINTModuleStatus[]>([]);

  useEffect(() => {
    const cancel = EventsOn("osint:progress", (m: identity.OSINTModuleStatus) => {
      setLiveModules((prev) => {
        const idx = prev.findIndex((p) => p.name === m.name);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = m;
          return next;
        }
        return [...prev, m];
      });
    });
    return () => cancel();
  }, []);

  const handleScan = async () => {
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);
    setLiveModules([]);
    try {
      const r = await RunOSINTDashboard(target.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Perform OSINT analysis summary for target "${result.target}":\n${JSON.stringify({ risk: result.risk_level, username_found: result.username?.found_count, breaches: result.email_breach?.breach_count, wayback: result.wayback?.total }, null, 2)}`);
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `osint_${result.target}.json`;
    a.click();
  };

  const modules = result?.modules || liveModules;
  const riskColor = result?.risk_level ? RISK_COLORS[result.risk_level] ?? "#00FF88" : "#00FF88";

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>OSINT Dashboard</h1>
        <p className="text-secondary">Unified intelligence — username, email breaches, Wayback, dorks — all at once</p>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleScan()}
          placeholder="target@email.com, example.com, or username"
          className="tool-input"
          style={{ flex: 1 }}
        />
        <button className="tool-scan-btn" onClick={handleScan} disabled={loading || !target.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><Radar size={15} /> Scan</>}
        </button>
      </div>

      {/* Live module progress */}
      {(loading || modules.length > 0) && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <p className="result-card-title">Module Status</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {modules.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.status === "running" && <Loader2 size={14} className="animate-spin" style={{ color: "#FFB800", flexShrink: 0 }} />}
                {m.status === "done" && <CheckCircle size={14} style={{ color: "#00FF88", flexShrink: 0 }} />}
                {m.status === "error" && <XCircle size={14} style={{ color: "#FF3344", flexShrink: 0 }} />}
                {m.status === "skipped" && <Clock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                <span style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</span>
                <span className="text-secondary" style={{ fontSize: 12 }}>{m.message}</span>
              </div>
            ))}
            {loading && modules.length === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={14} className="animate-spin" style={{ color: "#FFB800" }} />
                <span className="text-secondary" style={{ fontSize: 13 }}>Starting modules...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {result && !loading && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
            {/* Risk summary */}
            <div className="result-card" style={{ borderColor: riskColor + "40" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Radar size={28} style={{ color: riskColor }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: riskColor, textTransform: "uppercase" }}>
                      {result.risk_level} Risk — Score: {result.risk_score}/100
                    </div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>
                      Target: {result.target} · Type: {result.target_type}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="tool-action-btn" onClick={handleAI}>AI Analyze</button>
                  <button className="tool-action-btn" onClick={handleExport}>
                    <Download size={13} /> Export
                  </button>
                </div>
              </div>
            </div>

            {/* Username results */}
            {result.username && result.username.found_count > 0 && (
              <div className="result-card">
                <p className="result-card-title">
                  Username Found on {result.username.found_count} Platforms
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.username.found?.slice(0, 20).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => BrowserOpenURL(p.url)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--accent)",
                      }}
                    >
                      {p.platform} <ExternalLink size={10} />
                    </button>
                  ))}
                  {result.username.found_count > 20 && (
                    <span className="text-muted" style={{ fontSize: 12, padding: "4px 10px" }}>
                      +{result.username.found_count - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Email breach */}
            {result.email_breach && (
              <div className="result-card" style={{ borderColor: result.email_breach.found ? "#FF334430" : "#00FF8820" }}>
                <p className="result-card-title">Email Breach Check</p>
                {result.email_breach.found ? (
                  <>
                    <span className="result-badge danger" style={{ fontSize: 14, padding: "6px 14px" }}>
                      {result.email_breach.breach_count} Breaches Found
                    </span>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.email_breach.breaches?.slice(0, 10).map((b, i) => (
                        <span key={i} className="result-badge danger" style={{ fontSize: 11 }}>{b.title || b.name}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="result-badge success">No breaches found</span>
                )}
              </div>
            )}

            {/* Wayback */}
            {result.wayback && result.wayback.total > 0 && (
              <div className="result-card">
                <p className="result-card-title">Wayback Machine</p>
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: 20 }}>
                      {result.wayback.total.toLocaleString()}
                    </div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>Snapshots</div>
                  </div>
                  {result.wayback.first_seen && (
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 13 }}>{result.wayback.first_seen.slice(0, 10)}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>First archived</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dorks count */}
            {result.dorks && (
              <div className="result-card">
                <p className="result-card-title">Google Dorks</p>
                <span className="result-badge info">
                  {result.dorks.total} dork queries generated across {result.dorks.groups?.length} categories
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {!result && !loading && liveModules.length === 0 && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Radar size={40} className="text-muted" />
          <p className="text-muted">Enter a target (email, domain, or username) for a full OSINT scan</p>
        </div>
      )}
    </div>
  );
}
