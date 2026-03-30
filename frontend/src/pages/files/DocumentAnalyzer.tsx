import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileWarning, Upload, AlertTriangle, ShieldAlert, Link2, Eye, Code2 } from "lucide-react";
import { AnalyzeDocument, OpenFileDialog, QueryAI } from "../../../wailsjs/go/main/App";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import type { files } from "../../../wailsjs/go/models";

const RISK_COLORS = {
  critical: "#FF3344",
  high: "#FF6633",
  medium: "#FFB800",
  low: "#00FF88",
};

export default function DocumentAnalyzer() {
  const [result, setResult] = useState<files.DocumentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFile = async (path: string) => {
    setLoading(true);
    try {
      const r = await AnalyzeDocument(path);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async () => {
    const path = await OpenFileDialog("Select Document for Security Analysis");
    if (path) processFile(path);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const path = (file as any).path;
      if (path) processFile(path);
    }
  }, []);

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze this document security report and explain the risks:\n${JSON.stringify(result, null, 2)}`);
  };

  const riskColor = result?.risk_level
    ? RISK_COLORS[result.risk_level as keyof typeof RISK_COLORS] ?? "#00FF88"
    : "#00FF88";

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Document Analyzer</h1>
        <p className="text-secondary">Deep security scan — macros, hidden text, tracking pixels, embedded URLs</p>
      </motion.div>

      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handlePick}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        style={{
          marginTop: 24,
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--bg-hover)" : "var(--bg-card)",
          transition: "all 0.2s",
        }}
      >
        <Upload size={36} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Drop a document or click to browse</p>
        <p className="text-muted" style={{ fontSize: 13 }}>PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX</p>
      </motion.div>

      {loading && (
        <div style={{ marginTop: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" style={{ marginBottom: 8 }} />)}
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
          {result.error ? (
            <div className="result-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFB800" }}>
                <AlertTriangle size={16} /> <span>{result.error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Risk summary */}
              <div className="result-card" style={{ borderColor: riskColor + "40" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="score-circle" style={{ "--score-color": riskColor } as any}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: riskColor }}>
                        {result.risk_score}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: riskColor, textTransform: "uppercase" }}>
                        {result.risk_level} Risk
                      </div>
                      <div className="text-secondary" style={{ fontSize: 13 }}>
                        {result.file_name} · {result.file_type}
                      </div>
                    </div>
                  </div>
                  <button className="tool-action-btn" onClick={handleAI}>AI Analyze</button>
                </div>

                {/* Flag chips */}
                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { label: "Macros", icon: Code2, value: result.has_macros },
                    { label: "Hidden Text", icon: Eye, value: result.has_hidden_text },
                    { label: "Tracking Pixel", icon: ShieldAlert, value: result.has_tracking_pixel },
                    { label: "Embedded URLs", icon: Link2, value: result.has_embedded_urls },
                  ].map(({ label, icon: Icon, value }) => (
                    <span
                      key={label}
                      className={`result-badge ${value ? "danger" : "success"}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Icon size={11} />
                      {label}: {value ? "YES" : "No"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings?.length > 0 && (
                <div className="result-card" style={{ borderColor: "#FF334430" }}>
                  <p className="result-card-title" style={{ color: "#FF3344" }}>
                    <AlertTriangle size={13} /> Warnings
                  </p>
                  {result.warnings.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "#FF3344" }}>⚠</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Macro indicators */}
              {result.macro_indicators?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title"><Code2 size={13} /> Macro / Script Indicators</p>
                  {result.macro_indicators.map((m, i) => (
                    <div key={i} style={{ fontFamily: "monospace", fontSize: 12, padding: "4px 0", color: "#FFB800" }}>{m}</div>
                  ))}
                </div>
              )}

              {/* Hidden texts */}
              {result.hidden_texts?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title"><Eye size={13} /> Hidden Content</p>
                  {result.hidden_texts.map((t, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "4px 0", color: "#FFB800" }}>{t}</div>
                  ))}
                </div>
              )}

              {/* Embedded URLs */}
              {result.embedded_urls?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title"><Link2 size={13} /> Embedded URLs ({result.embedded_urls.length})</p>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Risk</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.embedded_urls.slice(0, 30).map((u, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "monospace", fontSize: 11, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.url}
                          </td>
                          <td>
                            <span className={`result-badge ${u.is_suspicious ? "danger" : "success"}`}>
                              {u.is_suspicious ? "Suspicious" : "Normal"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="tool-action-btn"
                              style={{ padding: "2px 8px", fontSize: 11 }}
                              onClick={() => BrowserOpenURL(u.url)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Revisions */}
              {result.revisions?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title">Author / Revision History ({result.revisions.length})</p>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Author</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.revisions.map((r, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--accent)" }}>{r.author}</td>
                          <td>{r.action}</td>
                          <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.timestamp || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {!result && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <FileWarning size={40} className="text-muted" />
          <p className="text-muted">Drop a document for deep security analysis</p>
        </div>
      )}
    </div>
  );
}
