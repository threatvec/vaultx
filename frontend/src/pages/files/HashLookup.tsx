import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Upload, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { LookupHashVT, HashFilePath, OpenAnyFileDialog } from "../../../wailsjs/go/main/App";
import type { files } from "../../../wailsjs/go/models";

export default function HashLookup() {
  const [hashInput, setHashInput] = useState("");
  const [result, setResult] = useState<files.HashLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"hash" | "file">("hash");

  const handleHashLookup = async () => {
    if (!hashInput.trim()) return;
    setLoading(true);
    try {
      const r = await LookupHashVT(hashInput.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleFileLookup = async () => {
    const path = await OpenAnyFileDialog("Select File to Hash & Scan");
    if (!path) return;
    setLoading(true);
    try {
      const hashes = await HashFilePath(path);
      setHashInput(hashes.sha256);
      const r = await LookupHashVT(hashes.sha256);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const detectionPct = result?.total_engines
    ? Math.round(((result.malicious + result.suspicious) / result.total_engines) * 100)
    : 0;

  const getRiskColor = () => {
    if (!result?.found) return "var(--text-muted)";
    if (result.malicious > 0) return "#FF3344";
    if (result.suspicious > 0) return "#FFB800";
    return "#00FF88";
  };

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Hash Lookup</h1>
        <p className="text-secondary">Check MD5/SHA1/SHA256 hash against VirusTotal (70+ engines)</p>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {(["hash", "file"] as const).map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "hash" ? <><Search size={14} /> Enter Hash</> : <><Upload size={14} /> Upload File</>}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "hash" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHashLookup()}
              placeholder="MD5 (32), SHA1 (40), or SHA256 (64) hash"
              className="tool-input"
              style={{ flex: 1, fontFamily: "monospace" }}
            />
            <button className="tool-scan-btn" onClick={handleHashLookup} disabled={loading || !hashInput.trim()}>
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>
        ) : (
          <button
            className="tool-scan-btn"
            onClick={handleFileLookup}
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Upload size={16} />
            {loading ? "Hashing & Scanning..." : "Choose File & Scan on VirusTotal"}
          </button>
        )}
      </div>

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
                <AlertTriangle size={16} />
                <span>{result.error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Verdict */}
              <div className="result-card">
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  {/* Progress ring */}
                  <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                    <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="8" />
                      <circle
                        cx="40" cy="40" r="32"
                        fill="none"
                        stroke={getRiskColor()}
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - detectionPct / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      fontFamily: "monospace", fontWeight: 700, fontSize: 16,
                      color: getRiskColor(),
                    }}>
                      {detectionPct}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: getRiskColor(), marginBottom: 4 }}>
                      {result.malicious > 0 ? "MALICIOUS" : result.suspicious > 0 ? "SUSPICIOUS" : result.found ? "CLEAN" : "NOT FOUND"}
                    </div>
                    {result.found && (
                      <div className="text-secondary" style={{ fontSize: 13 }}>
                        {result.malicious + result.suspicious} / {result.total_engines} engines detected
                      </div>
                    )}
                    {result.threat_label && (
                      <div style={{ marginTop: 4 }}>
                        <span className="result-badge danger">{result.threat_label}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              {result.found && (
                <div className="result-card">
                  <div className="result-grid">
                    {[
                      ["Hash", result.hash],
                      ["Hash Type", result.hash_type],
                      ["File Name", result.file_name || "—"],
                      ["File Type", result.file_type || "—"],
                      ["File Size", result.file_size ? `${result.file_size} bytes` : "—"],
                      ["Malware Family", result.malware_family || "—"],
                      ["First Seen", result.first_seen || "—"],
                      ["Last Seen", result.last_seen || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="result-row">
                        <span className="result-label">{label}</span>
                        <span className="result-value" style={{ fontFamily: label === "Hash" ? "monospace" : undefined, fontSize: label === "Hash" ? 11 : undefined }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {result.permalink && (
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); import("../../../wailsjs/runtime/runtime").then(r => r.BrowserOpenURL(result.permalink)); }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, color: "var(--accent)", fontSize: 13 }}
                    >
                      <ExternalLink size={13} /> View on VirusTotal
                    </a>
                  )}
                </div>
              )}

              {/* Detection results */}
              {result.engines?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title">Detections ({result.engines.length})</p>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Engine</th>
                        <th>Category</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.engines.map((e, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{e.engine}</td>
                          <td>
                            <span className={`result-badge ${e.category === "malicious" ? "danger" : "warning"}`}>
                              {e.category}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: 11 }}>{e.result}</td>
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
          <Shield size={40} className="text-muted" />
          <p className="text-muted">Enter a hash or upload a file to check for malware</p>
        </div>
      )}
    </div>
  );
}
