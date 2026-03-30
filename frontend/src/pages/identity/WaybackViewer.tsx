import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, BarChart2 } from "lucide-react";
import { LookupWayback } from "../../../wailsjs/go/main/App";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import ToolPage from "../../components/ToolPage";
import type { identity } from "../../../wailsjs/go/models";

export default function WaybackViewer() {
  const [result, setResult] = useState<identity.WaybackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const handleQuery = async (input: string) => {
    setLoading(true);
    setYearFilter(null);
    try {
      const r = await LookupWayback(input.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result.snapshots, null, 2));
  };

  const maxCount = result?.year_summary
    ? Math.max(...result.year_summary.map((y) => y.count), 1)
    : 1;

  const filtered = result?.snapshots
    ? yearFilter
      ? result.snapshots.filter((s) => s.year === yearFilter)
      : result.snapshots
    : [];

  return (
    <ToolPage
      title="Wayback Machine Viewer"
      description="Browse historical snapshots of any website from the Internet Archive"
      placeholder="example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="wayback"
      hasResult={!!result}
      onCopy={handleCopy}
    >
      {result && (
        <>
          {result.error && result.total === 0 ? (
            <div className="result-card">
              <p style={{ color: "#FFB800" }}>{result.error}</p>
            </div>
          ) : (
            <>
              <div className="result-card">
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>
                      {result.total.toLocaleString()}
                    </div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>Total Snapshots</div>
                  </div>
                  {result.first_seen && (
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 14 }}>{result.first_seen.slice(0, 10)}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>First Seen</div>
                    </div>
                  )}
                  {result.last_seen && (
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 14 }}>{result.last_seen.slice(0, 10)}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>Last Seen</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Year timeline / bar chart */}
              {result.year_summary?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title"><BarChart2 size={13} /> Snapshots by Year</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, overflowX: "auto" }}>
                    {result.year_summary.map((ys) => {
                      const pct = (ys.count / maxCount) * 100;
                      const isSelected = yearFilter === ys.year;
                      return (
                        <div
                          key={ys.year}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0 }}
                          onClick={() => setYearFilter(yearFilter === ys.year ? null : ys.year)}
                        >
                          <motion.div
                            style={{
                              width: 24,
                              background: isSelected ? "var(--accent)" : "#0066FF80",
                              borderRadius: "4px 4px 0 0",
                              minHeight: 4,
                            }}
                            animate={{ height: `${Math.max(pct * 0.7, 4)}px` }}
                            transition={{ duration: 0.4 }}
                            title={`${ys.year}: ${ys.count}`}
                          />
                          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                            {ys.year}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {yearFilter && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)" }}>
                      Showing {yearFilter} — <button onClick={() => setYearFilter(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>Clear filter</button>
                    </div>
                  )}
                </div>
              )}

              {/* Snapshots table */}
              {filtered.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title">
                    <Clock size={13} /> Snapshots {yearFilter ? `(${yearFilter})` : "(latest 200)"}
                  </p>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>URL</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice().reverse().slice(0, 100).map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
                            {s.timestamp}
                          </td>
                          <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                            {s.url}
                          </td>
                          <td>
                            <span className={`result-badge ${s.status_code === "200" ? "success" : "warning"}`}>
                              {s.status_code}
                            </span>
                          </td>
                          <td>
                            <button
                              className="tool-action-btn"
                              style={{ padding: "2px 8px", fontSize: 11 }}
                              onClick={() => BrowserOpenURL(s.archive_url)}
                            >
                              <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </ToolPage>
  );
}
