import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BarChart3, Shield, Activity, AlertTriangle, Download, Calendar, Eye } from "lucide-react";
import { GetDashboardStats, GetRecentActivity } from "../../wailsjs/go/main/App";

interface Stats {
  totalScans: number;
  threatsDetected: number;
  avgRiskScore: number;
  activeMonitors: number;
}

interface Activity {
  tool: string;
  query: string;
  timestamp: string;
  risk?: number;
}

type Range = "7d" | "30d" | "custom";

const TOOL_COLORS = ["#00FF88", "#0066FF", "#FF3344", "#FFB800", "#CC66FF", "#00CCFF", "#FF6633", "#FF3399"];

export default function Report() {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [stats, setStats] = useState<Stats>({ totalScans: 0, threatsDetected: 0, avgRiskScore: 0, activeMonitors: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, a] = await Promise.all([GetDashboardStats(), GetRecentActivity(100)]);
        setStats({ totalScans: s?.TotalScans || s?.totalScans || 0, threatsDetected: s?.ThreatsDetected || s?.threatsDetected || 0, avgRiskScore: s?.AvgRiskScore || s?.avgRiskScore || 0, activeMonitors: s?.ActiveMonitors || s?.activeMonitors || 0 });
        setActivity((a || []).map((item: any) => ({ tool: item.tool || item.Tool || "unknown", query: item.query || item.Query || "", timestamp: item.timestamp || item.Timestamp || "", risk: item.risk || item.Risk || 0 })));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const filterByRange = (items: Activity[]) => {
    const now = Date.now();
    const ms = range === "7d" ? 7 * 86400000 : range === "30d" ? 30 * 86400000 : Infinity;
    return items.filter((item) => {
      if (range === "custom") {
        const ts = new Date(item.timestamp).getTime();
        const from = customFrom ? new Date(customFrom).getTime() : 0;
        const to = customTo ? new Date(customTo + "T23:59:59").getTime() : Infinity;
        return ts >= from && ts <= to;
      }
      return now - new Date(item.timestamp).getTime() <= ms;
    });
  };

  const filtered = filterByRange(activity);

  const toolCounts = filtered.reduce<Record<string, number>>((acc, item) => {
    acc[item.tool] = (acc[item.tool] || 0) + 1;
    return acc;
  }, {});
  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = sortedTools[0]?.[1] || 1;

  const risks = filtered.map((i) => i.risk || 0);
  const lowCount = risks.filter((r) => r < 30).length;
  const medCount = risks.filter((r) => r >= 30 && r < 70).length;
  const highCount = risks.filter((r) => r >= 70).length;
  const total = risks.length || 1;

  const nightwatchAlerts = filtered.filter((i) => i.tool.toLowerCase().includes("nightwatch") || (i.risk || 0) >= 70);

  const recommendations: string[] = [];
  if (highCount > 0) recommendations.push(`${highCount} high-risk scan(s) detected — review targets immediately`);
  if (nightwatchAlerts.length > 0) recommendations.push(`${nightwatchAlerts.length} NightWatch alert(s) require attention`);
  if (stats.threatsDetected > 0) recommendations.push(`${stats.threatsDetected} threat(s) found — consider threat mitigation`);
  if (stats.totalScans === 0) recommendations.push("No scans recorded — start scanning to build your security baseline");
  if (recommendations.length === 0) recommendations.push("All systems nominal — continue regular monitoring");

  const handlePrint = () => window.print();

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { border: 1px solid #ddd !important; background: white !important; }
        }
      `}</style>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>Security Report</h1>
          <p style={{ color: "var(--text-secondary)" }}>Summary of your security scanning activity</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }} className="no-print">
          {(["7d", "30d", "custom"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${range === r ? "var(--accent)" : "var(--border)"}`, background: range === r ? "var(--accent)" : "var(--bg-surface)", color: range === r ? "#000" : "var(--text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: range === r ? 700 : 400 }}>
              {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Custom"}
            </button>
          ))}
          <button onClick={handlePrint} style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px" }}>
            <Download size={14} /> Download PDF
          </button>
        </div>
      </motion.div>

      {range === "custom" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="no-print"
          style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
          <Calendar size={14} style={{ color: "var(--text-muted)" }} />
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }} />
          <span style={{ color: "var(--text-muted)" }}>to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }} />
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Scans", value: stats.totalScans, icon: Activity, color: "#00FF88" },
          { label: "Threats Found", value: stats.threatsDetected, icon: AlertTriangle, color: "#FF3344" },
          { label: "Avg Risk Score", value: Math.round(stats.avgRiskScore), icon: Shield, color: "#FFB800" },
          { label: "Active Monitors", value: stats.activeMonitors, icon: Eye, color: "#0066FF" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="print-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "2px" }}>{label}</p>
              <p style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700 }}>{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Most Used Tools */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="print-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={16} style={{ color: "var(--accent)" }} /> Most Used Tools
          </h3>
          {sortedTools.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No data available</p>
          ) : sortedTools.map(([tool, count], i) => (
            <div key={tool} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{tool}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{count}</span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-surface)", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxCount) * 100}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  style={{ height: "100%", borderRadius: "3px", background: TOOL_COLORS[i % TOOL_COLORS.length] }} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="print-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>Risk Distribution</h3>
          <svg viewBox="0 0 200 200" width="160" height="160" style={{ display: "block", margin: "0 auto 16px" }}>
            {(() => {
              const segments = [
                { value: lowCount, color: "#00FF88", label: "Low" },
                { value: medCount, color: "#FFB800", label: "Med" },
                { value: highCount, color: "#FF3344", label: "High" },
              ];
              let offset = 0;
              return segments.map(({ value, color, label }) => {
                const pct = value / total;
                const len = pct * 2 * Math.PI * 70;
                const el = (
                  <circle key={label} cx="100" cy="100" r="70" fill="none" stroke={color} strokeWidth="28"
                    strokeDasharray={`${len} ${2 * Math.PI * 70 - len}`}
                    strokeDashoffset={-(offset * 2 * Math.PI * 70)}
                    transform="rotate(-90 100 100)" style={{ transition: "stroke-dasharray 0.5s" }} />
                );
                offset += pct;
                return el;
              });
            })()}
            <text x="100" y="105" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="bold">{total}</text>
            <text x="100" y="120" textAnchor="middle" fill="var(--text-muted)" fontSize="10">scans</text>
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            {[{ label: "Low", count: lowCount, color: "#00FF88" }, { label: "Medium", count: medCount, color: "#FFB800" }, { label: "High", count: highCount, color: "#FF3344" }].map(({ label, count, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, margin: "0 auto 4px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>{label}</p>
                <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 700 }}>{count}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* NightWatch Alerts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="print-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          🌙 NightWatch Alerts
          {nightwatchAlerts.length > 0 && <span style={{ background: "#FF3344", color: "#fff", borderRadius: "12px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }}>{nightwatchAlerts.length}</span>}
        </h3>
        {nightwatchAlerts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No alerts in selected period</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {nightwatchAlerts.slice(0, 10).map((alert, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,51,68,0.06)", borderRadius: "8px", border: "1px solid rgba(255,51,68,0.15)" }}>
                <div>
                  <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>{alert.query || "—"}</span>
                  <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "11px" }}>{alert.tool}</span>
                </div>
                <span style={{ color: "#FF3344", fontSize: "12px", fontWeight: 600 }}>Risk {alert.risk}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recommendations */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="print-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={16} style={{ color: "var(--accent)" }} /> Recommended Actions
        </h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recommendations.map((rec, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: i < recommendations.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", marginTop: "6px", flexShrink: 0 }} />
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{rec}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
