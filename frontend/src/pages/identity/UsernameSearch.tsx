import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, User, ExternalLink, Download } from "lucide-react";
import { SearchUsername } from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import type { identity } from "../../../wailsjs/go/models";

const CATEGORY_COLORS: Record<string, string> = {
  code: "#0066FF",
  social: "#00FF88",
  gaming: "#FF6633",
  creative: "#FF3399",
  professional: "#FFB800",
  forum: "#9944FF",
  crypto: "#00CCFF",
};

export default function UsernameSearch() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<identity.UsernameSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveResults, setLiveResults] = useState<identity.PlatformResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<"all" | "found" | "not_found">("found");

  useEffect(() => {
    const cancel = EventsOn("username:progress", (p: identity.PlatformResult) => {
      setLiveResults((prev) => [...prev, p]);
      setProgress((prev) => prev + 1);
    });
    return () => cancel();
  }, []);

  const handleSearch = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setResult(null);
    setLiveResults([]);
    setProgress(0);
    try {
      const r = await SearchUsername(username.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const lines = result.found.map((p) => `${p.platform}: ${p.url}`).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `username_${result.username}.txt`;
    a.click();
  };

  const displayList = result
    ? filter === "found"
      ? result.found
      : filter === "not_found"
      ? result.not_found
      : [...result.found, ...result.not_found]
    : liveResults.filter((r) => r.found);

  const total = 100; // approximate platform count

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Username Search</h1>
        <p className="text-secondary">Check 100+ platforms simultaneously for a username</p>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          placeholder="Enter username to search..."
          className="tool-input"
          style={{ flex: 1 }}
        />
        <button className="tool-scan-btn" onClick={handleSearch} disabled={loading || !username.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={15} /> Search</>}
        </button>
      </div>

      {loading && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span className="text-secondary">Scanning platforms...</span>
            <span style={{ color: "var(--accent)" }}>{progress}/{total}</span>
          </div>
          <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: "var(--accent)", borderRadius: 3 }}
              animate={{ width: `${Math.min((progress / total) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#00FF88" }}>
            {liveResults.filter((r) => r.found).length} found so far
          </div>
        </div>
      )}

      {(result || liveResults.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
          {result && (
            <div className="result-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="result-badge success" style={{ fontSize: 15, padding: "6px 14px" }}>
                    {result.found_count} found
                  </span>
                  <span className="text-secondary" style={{ fontSize: 13 }}>
                    out of {result.total} platforms
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["found", "not_found", "all"] as const).map((f) => (
                    <button
                      key={f}
                      className={`tab-btn ${filter === f ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: 12 }}
                      onClick={() => setFilter(f)}
                    >
                      {f === "found" ? "Found" : f === "not_found" ? "Not Found" : "All"}
                    </button>
                  ))}
                  <button className="tool-action-btn" onClick={handleExport}>
                    <Download size={13} /> Export
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 10,
              marginTop: 12,
            }}
          >
            <AnimatePresence>
              {displayList.map((p, i) => (
                <motion.div
                  key={p.platform + i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: i < 30 ? i * 0.01 : 0 }}
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${p.found ? CATEGORY_COLORS[p.category] + "40" : "var(--border)"}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: p.found
                          ? CATEGORY_COLORS[p.category] || "#00FF88"
                          : "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.platform}
                      </div>
                      {p.found && (
                        <div style={{ fontSize: 10, color: CATEGORY_COLORS[p.category] || "var(--accent)" }}>
                          {p.category}
                        </div>
                      )}
                    </div>
                  </div>
                  {p.found && (
                    <button
                      onClick={() => BrowserOpenURL(p.url)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 2, flexShrink: 0 }}
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {!result && !loading && liveResults.length === 0 && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <User size={40} className="text-muted" />
          <p className="text-muted">Enter a username to search across 100+ platforms</p>
        </div>
      )}
    </div>
  );
}
