import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Download, Trash2, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, X, Clock, AlertCircle,
} from "lucide-react";

interface QueryLog {
  id: string;
  toolName: string;
  input: string;
  result: string;
  riskScore: number;
  duration: number;
  timestamp: string;
  bookmarked: boolean;
}

interface LogsResult {
  logs: QueryLog[];
  total: number;
}

const TOOL_ICONS: Record<string, string> = {
  shadowscan: "🔭", "shadow-scan": "🔭",
  urlscanner: "🔗", "url-scanner": "🔗",
  whois: "📋", dns: "🌐", ssl: "🔒", http: "📡",
  fingerprint: "🖐️", phishing: "🎣", nightwatch: "🌙",
  ipreputation: "🚦", cve: "🐛", ip: "🌍", port: "🔌",
  network: "🔧", metadata: "📄", exif: "📷", hash: "#️⃣",
  qr: "📱", document: "🔬", username: "👤", email: "📧",
  phone: "📞", wayback: "🕰️", dork: "🔎", osint: "🕵️",
  password: "🔑", totp: "🔐", "2fa": "🔐",
  encoder: "⚗️", ai: "🤖", scanme: "🔍", scan: "🔍",
};

function getToolIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "⚙️";
}

function getRiskColor(score: number): string {
  if (score < 30) return "#00FF88";
  if (score < 70) return "#FFB800";
  return "#FF3344";
}

function getRiskLabel(score: number): string {
  if (score < 30) return "Low";
  if (score < 70) return "Medium";
  return "High";
}

const PAGE_SIZE = 50;

export default function History() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterTool, setFilterTool] = useState("all");
  const [toolNames, setToolNames] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailLog, setDetailLog] = useState<QueryLog | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let queryLogs: QueryLog[] = [];
      let fetchedTotal = 0;
      try {
        const mod = await import("../../wailsjs/go/main/App");
        if (typeof (mod as any).GetQueryLogs === "function") {
          const result: LogsResult = await (mod as any).GetQueryLogs(
            filterTool === "all" ? "" : filterTool,
            fromDate, toDate, searchText,
            PAGE_SIZE, (page - 1) * PAGE_SIZE
          );
          queryLogs = result?.logs || [];
          fetchedTotal = result?.total || 0;
        } else {
          const history = await (mod as any).GetQueryHistory("", 500);
          const all: QueryLog[] = (history || []).map((h: any, i: number) => ({
            id: String(i),
            toolName: h.tool || h.Tool || "unknown",
            input: h.query || h.Query || "",
            result: h.result || h.Result || "",
            riskScore: h.riskScore || h.RiskScore || 0,
            duration: h.duration || h.Duration || 0,
            timestamp: h.timestamp || h.Timestamp || new Date().toISOString(),
            bookmarked: false,
          }));
          const filtered = all.filter((l) => {
            if (filterTool !== "all" && !l.toolName.toLowerCase().includes(filterTool.toLowerCase())) return false;
            if (searchText && !l.input.toLowerCase().includes(searchText.toLowerCase())) return false;
            if (fromDate && l.timestamp < fromDate) return false;
            if (toDate && l.timestamp > toDate + "T23:59:59") return false;
            return true;
          });
          fetchedTotal = filtered.length;
          queryLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
          const names = Array.from(new Set(all.map((l) => l.toolName)));
          setToolNames(names);
        }
      } catch {
        queryLogs = [];
        fetchedTotal = 0;
      }
      setLogs(queryLogs);
      setTotal(fetchedTotal);
    } finally {
      setLoading(false);
    }
  }, [filterTool, fromDate, toDate, searchText, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const toggleBookmark = async (log: QueryLog) => {
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (typeof (mod as any).BookmarkLog === "function") {
        await (mod as any).BookmarkLog(log.id, !log.bookmarked);
      }
    } catch {}
    setLogs((prev) => prev.map((l) => l.id === log.id ? { ...l, bookmarked: !l.bookmarked } : l));
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (typeof (mod as any).DeleteQueryLogs === "function") {
        await (mod as any).DeleteQueryLogs(Array.from(selected));
      }
    } catch {}
    setLogs((prev) => prev.filter((l) => !selected.has(l.id)));
    setSelected(new Set());
    setTotal((t) => t - selected.size);
  };

  const deleteAll = async () => {
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (typeof (mod as any).DeleteAllQueryLogs === "function") {
        await (mod as any).DeleteAllQueryLogs();
      }
    } catch {}
    setLogs([]);
    setTotal(0);
    setSelected(new Set());
    setConfirmDeleteAll(false);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultx-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatResult = (raw: string) => {
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>
          Query History
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          Browse, filter and manage all past scan logs
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }} className="no-print">
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            placeholder="Search input..."
            style={{ width: "100%", paddingLeft: "32px", padding: "8px 8px 8px 32px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" }} />
        </div>
        <select value={filterTool} onChange={(e) => { setFilterTool(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}>
          <option value="all">All Tools</option>
          {toolNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }} />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }} />
        <button onClick={exportJSON} style={{ padding: "8px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <Download size={14} /> Export JSON
        </button>
        {selected.size > 0 && (
          <button onClick={deleteSelected} style={{ padding: "8px 16px", background: "rgba(255,51,68,0.1)", border: "1px solid #FF3344", borderRadius: "8px", color: "#FF3344", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <Trash2 size={14} /> Delete Selected ({selected.size})
          </button>
        )}
        <button onClick={() => setConfirmDeleteAll(true)} style={{ padding: "8px 16px", background: "rgba(255,51,68,0.1)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px" }}>
          Delete All
        </button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            <Clock size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
            <p>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            <AlertCircle size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
            <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>No logs found</p>
            <p style={{ fontSize: "13px" }}>Run some scans to see your history here</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "32px" }}>
                  <input type="checkbox" checked={selected.size === logs.length && logs.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? new Set(logs.map((l) => l.id)) : new Set())} />
                </th>
                {["Tool", "Input", "Risk", "Duration", "Bookmark", "Timestamp"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} onClick={() => setDetailLog(log)}
                  style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px" }} onClick={(e) => { e.stopPropagation(); toggleSelect(log.id); }}>
                    <input type="checkbox" checked={selected.has(log.id)} onChange={() => {}} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "18px" }}>{getToolIcon(log.toolName)}
                    <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>{log.toolName}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontSize: "13px", maxWidth: "280px" }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.input}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: `${getRiskColor(log.riskScore)}22`, color: getRiskColor(log.riskScore) }}>
                      {getRiskLabel(log.riskScore)} {log.riskScore}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "13px" }}>{log.duration}ms</td>
                  <td style={{ padding: "12px 16px" }} onClick={(e) => { e.stopPropagation(); toggleBookmark(log); }}>
                    {log.bookmarked
                      ? <BookmarkCheck size={16} style={{ color: "var(--accent)" }} />
                      : <Bookmark size={16} style={{ color: "var(--text-muted)" }} />}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Page {page} of {totalPages} ({total} total)</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: "8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={() => setDetailLog(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "680px", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "28px", marginBottom: "4px" }}>{getToolIcon(detailLog.toolName)}</div>
                  <h2 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700 }}>{detailLog.toolName}</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>{new Date(detailLog.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => setDetailLog(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: `${getRiskColor(detailLog.riskScore)}22`, color: getRiskColor(detailLog.riskScore) }}>
                  Risk: {detailLog.riskScore} ({getRiskLabel(detailLog.riskScore)})
                </span>
                <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                  {detailLog.duration}ms
                </span>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Input</p>
                <div style={{ background: "var(--bg-surface)", borderRadius: "8px", padding: "12px", color: "var(--text-primary)", fontSize: "14px", wordBreak: "break-all" }}>{detailLog.input}</div>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Result</p>
                <pre style={{ background: "var(--bg-surface)", borderRadius: "8px", padding: "12px", color: "var(--text-secondary)", fontSize: "12px", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "300px", overflowY: "auto" }}>
                  {formatResult(detailLog.result)}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete All */}
      <AnimatePresence>
        {confirmDeleteAll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setConfirmDeleteAll(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
              <AlertCircle size={40} style={{ color: "#FF3344", margin: "0 auto 12px", display: "block" }} />
              <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Delete All Logs?</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>This action cannot be undone. All {total} query logs will be permanently deleted.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setConfirmDeleteAll(false)} style={{ padding: "10px 20px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}>Cancel</button>
                <button onClick={deleteAll} style={{ padding: "10px 20px", background: "#FF3344", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete All</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
