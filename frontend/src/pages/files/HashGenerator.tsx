import { useState } from "react";
import { motion } from "framer-motion";
import { Hash, Upload, Copy, CheckCircle, GitCompare } from "lucide-react";
import { HashText, HashFilePath, CompareHashes, OpenAnyFileDialog } from "../../../wailsjs/go/main/App";
import type { files } from "../../../wailsjs/go/models";

export default function HashGenerator() {
  const [tab, setTab] = useState<"text" | "file" | "compare">("text");
  const [textInput, setTextInput] = useState("");
  const [hashSet, setHashSet] = useState<files.HashSet | null>(null);
  const [hashA, setHashA] = useState("");
  const [hashB, setHashB] = useState("");
  const [compareResult, setCompareResult] = useState<files.CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string>("");

  const handleTextHash = async () => {
    setLoading(true);
    try {
      const r = await HashText(textInput);
      setHashSet(r);
    } finally {
      setLoading(false);
    }
  };

  const handleFileHash = async () => {
    const path = await OpenAnyFileDialog("Select File to Hash");
    if (!path) return;
    setLoading(true);
    try {
      const r = await HashFilePath(path);
      setHashSet(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    const r = await CompareHashes(hashA.trim(), hashB.trim());
    setCompareResult(r);
  };

  const copyHash = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const hashRows = hashSet ? [
    { label: "MD5", value: hashSet.md5 },
    { label: "SHA-1", value: hashSet.sha1 },
    { label: "SHA-256", value: hashSet.sha256 },
    { label: "SHA-512", value: hashSet.sha512 },
  ] : [];

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Hash Generator</h1>
        <p className="text-secondary">Compute MD5, SHA-1, SHA-256, SHA-512 — offline, instant</p>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {([
          { id: "text", label: "Text Input" },
          { id: "file", label: "File" },
          { id: "compare", label: "Compare" },
        ] as const).map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => { setTab(t.id); setHashSet(null); setCompareResult(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "text" && (
          <>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to hash..."
              className="tool-input"
              style={{ width: "100%", height: 100, resize: "vertical", fontFamily: "monospace" }}
            />
            <button
              className="tool-scan-btn"
              onClick={handleTextHash}
              disabled={loading || !textInput.trim()}
              style={{ marginTop: 8 }}
            >
              <Hash size={15} /> Generate Hashes
            </button>
          </>
        )}

        {tab === "file" && (
          <button className="tool-scan-btn" onClick={handleFileHash} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            <Upload size={15} /> {loading ? "Hashing..." : "Choose File & Hash"}
          </button>
        )}

        {tab === "compare" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              value={hashA}
              onChange={(e) => setHashA(e.target.value)}
              placeholder="Hash A"
              className="tool-input"
              style={{ fontFamily: "monospace" }}
            />
            <input
              type="text"
              value={hashB}
              onChange={(e) => setHashB(e.target.value)}
              placeholder="Hash B"
              className="tool-input"
              style={{ fontFamily: "monospace" }}
            />
            <button
              className="tool-scan-btn"
              onClick={handleCompare}
              disabled={!hashA.trim() || !hashB.trim()}
            >
              <GitCompare size={15} /> Compare
            </button>

            {compareResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="result-card"
                style={{ borderColor: compareResult.match ? "#00FF8840" : "#FF334440" }}
              >
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  {compareResult.match ? (
                    <div style={{ color: "#00FF88", fontSize: 18, fontWeight: 700 }}>
                      <CheckCircle size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
                      Hashes Match
                    </div>
                  ) : (
                    <div style={{ color: "#FF3344", fontSize: 18, fontWeight: 700 }}>
                      ✗ Hashes Do Not Match
                    </div>
                  )}
                  <div className="text-secondary" style={{ fontSize: 12, marginTop: 6 }}>
                    Type A: {compareResult.type_a} · Type B: {compareResult.type_b}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {hashSet && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
          <div className="result-card">
            {hashSet.source === "file" && (
              <div className="result-row" style={{ marginBottom: 12 }}>
                <span className="result-label">File</span>
                <span className="result-value" style={{ wordBreak: "break-all" }}>{hashSet.name}</span>
              </div>
            )}
            {hashRows.map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>{label}</span>
                  <button
                    onClick={() => copyHash(value, label)}
                    className="tool-action-btn"
                    style={{ padding: "2px 8px", fontSize: 11 }}
                  >
                    {copied === label ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied === label ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    wordBreak: "break-all",
                    background: "var(--bg-hover)",
                    padding: "8px 12px",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    cursor: "text",
                    userSelect: "all",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!hashSet && !compareResult && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Hash size={40} className="text-muted" />
          <p className="text-muted">Enter text, pick a file, or compare two hashes</p>
        </div>
      )}
    </div>
  );
}
