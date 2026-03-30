import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Rss, RefreshCw, Filter, Loader2, AlertTriangle,
  ExternalLink, Key, Clock, Shield, Settings as SettingsIcon,
} from "lucide-react";
import { GetThreatFeedData, GetSettings } from "../../../wailsjs/go/main/App";

const CATEGORY_COLORS: Record<string, string> = {
  Critical: "#FF3344",
  Malicious: "#FF6B00",
  "OTX Pulse": "#00CCFF",
  malware: "#FF3344",
  phishing: "#FF3399",
  botnet: "#9944FF",
  ddos: "#FFB800",
  default: "#FF6B00",
};

export default function ThreatFeed() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [hasKeys, setHasKeys] = useState<boolean | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkKeys();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadFeed, 5 * 60 * 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const checkKeys = async () => {
    try {
      const s = await GetSettings();
      const has = !!(s?.abuseipdb_api_key || s?.otx_api_key);
      setHasKeys(has);
      if (has) loadFeed();
    } catch {
      setHasKeys(false);
    }
  };

  const loadFeed = async () => {
    setLoading(true);
    try {
      const result = await GetThreatFeedData();
      setData(result);
    } catch (e) {
      console.error("ThreatFeed error:", e);
    }
    setLoading(false);
  };

  const filteredEntries = (data?.entries || []).filter(
    (e: any) => filter === "all" || e.category?.toLowerCase().includes(filter.toLowerCase()) || e.source?.toLowerCase().includes(filter.toLowerCase())
  );

  const categories = ["all", "Critical", "Malicious", "OTX Pulse", "malware", "phishing"];

  const formatTime = (ts: string) => {
    if (!ts) return "-";
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  // API key not configured — show setup screen
  if (hasKeys === false) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="flex items-center gap-3">
            <Rss size={28} style={{ color: "var(--accent)" }} />
            Threat Feed
          </h1>
          <p className="text-secondary">Live threat intelligence from AbuseIPDB & AlienVault OTX</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 mt-6"
          style={{ background: "#FF334410", border: "1px solid #FF334440" }}
        >
          <div className="flex items-start gap-4">
            <AlertTriangle size={32} style={{ color: "#FF3344", flexShrink: 0, marginTop: 4 }} />
            <div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "#FF3344" }}>
                API Key Required
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                This tool requires AbuseIPDB and/or AlienVault OTX API keys to fetch live threat intelligence data.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {["IP Reputation", "NightWatch", "Threat Feed"].map((tool) => (
                  <span key={tool} className="text-xs px-2 py-1 rounded" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    {tool}
                  </span>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <Key size={16} style={{ color: "var(--accent)" }} />
                  <div>
                    <span className="text-sm font-medium">AbuseIPDB</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded" style={{ background: "#00FF8815", color: "#00FF88" }}>Free</span>
                  </div>
                  <a href="https://www.abuseipdb.com/account/plans" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                    Register <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <Key size={16} style={{ color: "var(--accent)" }} />
                  <div>
                    <span className="text-sm font-medium">AlienVault OTX</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded" style={{ background: "#00FF8815", color: "#00FF88" }}>Free</span>
                  </div>
                  <a href="https://otx.alienvault.com/api" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                    Register <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <button
                onClick={() => {
                  // Navigate to settings (handled by parent via page navigation)
                  window.dispatchEvent(new CustomEvent("navigate", { detail: "settings" }));
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ background: "var(--accent)", color: "#000" }}
              >
                <SettingsIcon size={16} />
                Go to Settings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading initial check
  if (hasKeys === null) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent)" }} />
        </div>
      </div>
    );
  }

  // Main feed view
  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="flex items-center gap-3">
              <Rss size={28} style={{ color: "var(--accent)" }} />
              Threat Feed
            </h1>
            <p className="text-secondary">Live threat intelligence from AbuseIPDB & AlienVault OTX</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {data?.updated_at && (
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Clock size={12} />
                {formatTime(data.updated_at)}
              </span>
            )}

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
              style={{
                background: autoRefresh ? "var(--accent-muted)" : "var(--bg-card)",
                color: autoRefresh ? "var(--accent)" : "var(--text-secondary)",
                border: autoRefresh ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              <RefreshCw size={12} className={autoRefresh ? "animate-spin" : ""} />
              Auto (5m)
            </button>

            <button className="tool-action-btn" onClick={loadFeed} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <div className="flex gap-4 mt-4">
        <div className="stat-card" style={{ padding: "10px 20px" }}>
          <Shield size={18} style={{ color: "#FF3344" }} />
          <div>
            <span className="stat-card-value" style={{ color: "#FF3344", fontSize: 20 }}>{data?.total || 0}</span>
            <span className="stat-card-label">Total Threats</span>
          </div>
        </div>
        <div className="stat-card" style={{ padding: "10px 20px" }}>
          <Shield size={18} style={{ color: "#FF6B00" }} />
          <div>
            <span className="stat-card-value" style={{ color: "#FF6B00", fontSize: 20 }}>
              {(data?.entries || []).filter((e: any) => e.source === "AbuseIPDB").length}
            </span>
            <span className="stat-card-label">AbuseIPDB</span>
          </div>
        </div>
        <div className="stat-card" style={{ padding: "10px 20px" }}>
          <Shield size={18} style={{ color: "#00CCFF" }} />
          <div>
            <span className="stat-card-value" style={{ color: "#00CCFF", fontSize: 20 }}>
              {(data?.entries || []).filter((e: any) => e.source === "OTX").length}
            </span>
            <span className="stat-card-label">OTX</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`tab-btn ${filter === cat ? "active" : ""}`}
            onClick={() => setFilter(cat)}
            style={{ border: "1px solid var(--border)", borderRadius: 8 }}
          >
            <Filter size={12} style={{ display: "inline", marginRight: 4 }} />
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* Feed table */}
      {loading && !data ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-row" style={{ height: 48 }} />
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="result-card" style={{ marginTop: 20 }}>
          <table className="result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>IP / Domain</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Country</th>
                <th>Source</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry: any, i: number) => {
                const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.default;
                return (
                  <tr key={i}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 13 }}>
                      {entry.ip || entry.domain}
                    </td>
                    <td>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${color}20`, color }}
                      >
                        {entry.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: entry.confidence > 90 ? "#FF3344" : entry.confidence > 70 ? "#FFB800" : "#00FF88" }}>
                        {entry.confidence}%
                      </span>
                    </td>
                    <td>{entry.country_code || entry.country || "-"}</td>
                    <td>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: entry.source === "AbuseIPDB" ? "#FF6B0015" : "#00CCFF15",
                          color: entry.source === "AbuseIPDB" ? "#FF6B00" : "#00CCFF",
                        }}
                      >
                        {entry.source}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatTime(entry.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Rss size={40} className="text-muted" />
          <p className="text-muted">No threat data available. Click Refresh to fetch latest feed.</p>
        </div>
      )}

      {data?.error && (
        <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "#FFB80010", border: "1px solid #FFB80040", color: "#FFB800" }}>
          <AlertTriangle size={14} className="inline mr-2" />
          {data.error}
        </div>
      )}
    </div>
  );
}
