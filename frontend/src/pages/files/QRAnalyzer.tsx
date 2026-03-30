import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { QrCode, Upload, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { DecodeQR, OpenImageDialog } from "../../../wailsjs/go/main/App";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import type { files } from "../../../wailsjs/go/models";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  url: "URL",
  email: "Email Address",
  phone: "Phone / SMS",
  wifi: "WiFi Credentials",
  crypto: "Cryptocurrency Address",
  vcard: "Contact Card (vCard)",
  geo: "Geographic Location",
  text: "Plain Text",
};

export default function QRAnalyzer() {
  const [result, setResult] = useState<files.QRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFile = async (path: string) => {
    setLoading(true);
    try {
      const r = await DecodeQR(path);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async () => {
    const path = await OpenImageDialog("Select QR Code Image");
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

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>QR Code Analyzer</h1>
        <p className="text-secondary">Decode QR codes and automatically analyze embedded URLs for threats</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: result?.preview ? "240px 1fr" : "1fr", gap: 16, marginTop: 24 }}>
        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handlePick}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 12,
            padding: result?.preview ? 0 : 40,
            cursor: "pointer",
            background: dragging ? "var(--bg-hover)" : "var(--bg-card)",
            transition: "all 0.2s",
            overflow: "hidden",
            minHeight: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {result?.preview ? (
            <img
              src={`data:image/png;base64,${result.preview}`}
              alt="QR code"
              style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 240 }}
            />
          ) : (
            <div style={{ textAlign: "center" }}>
              <Upload size={36} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600 }}>Drop QR image or click to browse</p>
              <p className="text-muted" style={{ fontSize: 12 }}>PNG, JPG, GIF, BMP</p>
            </div>
          )}
        </motion.div>

        {/* Results */}
        {result && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.error ? (
              <div className="result-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFB800" }}>
                  <AlertTriangle size={16} />
                  <span>{result.error}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Status banner */}
                <div className="result-card" style={{ borderColor: result.is_suspicious ? "#FF334440" : "#00FF8840" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    {result.is_suspicious ? (
                      <AlertTriangle size={20} style={{ color: "#FF3344" }} />
                    ) : (
                      <CheckCircle size={20} style={{ color: "#00FF88" }} />
                    )}
                    <div style={{ fontWeight: 700, fontSize: 16, color: result.is_suspicious ? "#FF3344" : "#00FF88" }}>
                      {result.is_suspicious ? "Suspicious QR Code" : "QR Code Decoded"}
                    </div>
                    <span className="result-badge info" style={{ marginLeft: "auto" }}>
                      {CONTENT_TYPE_LABELS[result.content_type] || result.content_type}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      background: "var(--bg-hover)",
                      padding: "10px 14px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      wordBreak: "break-all",
                    }}
                  >
                    {result.content}
                  </div>

                  {result.is_url && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <button
                        className="tool-action-btn"
                        onClick={() => result.url && BrowserOpenURL(result.url)}
                      >
                        <ExternalLink size={13} /> Open URL
                      </button>
                    </div>
                  )}
                </div>

                {/* Warnings */}
                {result.warnings?.length > 0 && (
                  <div className="result-card" style={{ borderColor: "#FF334440" }}>
                    <p className="result-card-title" style={{ color: "#FF3344" }}>
                      <AlertTriangle size={13} /> Warnings ({result.warnings.length})
                    </p>
                    {result.warnings.map((w, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: "#FF3344", flexShrink: 0 }}>⚠</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ marginTop: 16 }}>
          {[1, 2].map((i) => <div key={i} className="skeleton-row" style={{ marginBottom: 8 }} />)}
        </div>
      )}

      {!result && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <QrCode size={40} className="text-muted" />
          <p className="text-muted">Drop a QR code image to decode and analyze it</p>
        </div>
      )}
    </div>
  );
}
