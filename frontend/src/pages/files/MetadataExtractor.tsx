import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, AlertTriangle, MapPin, Download } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { ExtractFileMetadata, OpenFileDialog, QueryAI } from "../../../wailsjs/go/main/App";
import type { files } from "../../../wailsjs/go/models";
import "leaflet/dist/leaflet.css";

const SUPPORTED = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".tiff", ".gif"];

export default function MetadataExtractor() {
  const [result, setResult] = useState<files.MetadataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFile = async (path: string) => {
    setLoading(true);
    try {
      const r = await ExtractFileMetadata(path);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async () => {
    const path = await OpenFileDialog("Select File for Metadata Extraction");
    if (path) processFile(path);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      // In Wails desktop, dataTransfer.files[0].path gives the local path
      const path = (file as any).path;
      if (path) processFile(path);
    }
  }, []);

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze this file metadata and identify privacy/security risks:\n${JSON.stringify(result, null, 2)}`);
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metadata_${result.file_name}.json`;
    a.click();
  };

  const riskColor = (risk?: string) => {
    switch (risk) {
      case "high": return "#FF3344";
      case "medium": return "#FFB800";
      default: return "var(--text-secondary)";
    }
  };

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Metadata Extractor</h1>
        <p className="text-secondary">Extract hidden metadata from PDF, Office, and image files</p>
      </motion.div>

      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
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
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Drop a file here or click to browse</p>
        <p className="text-muted" style={{ fontSize: 13 }}>
          Supported: {SUPPORTED.join(" ")}
        </p>
      </motion.div>

      {loading && (
        <div style={{ marginTop: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" style={{ marginBottom: 10 }} />)}
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
          {/* Header info */}
          <div className="result-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FileText size={28} style={{ color: "var(--accent)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{result.file_name}</div>
                  <div className="text-secondary" style={{ fontSize: 13 }}>
                    {result.file_type} · {result.fields?.["File Size"] || ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tool-action-btn" onClick={handleExport}>
                  <Download size={14} /> Export
                </button>
                <button className="tool-action-btn" onClick={handleAI}>
                  AI Analyze
                </button>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="result-card" style={{ borderColor: "#FF334440" }}>
              <p className="result-card-title" style={{ color: "#FF3344" }}>
                <AlertTriangle size={14} /> Security Warnings
              </p>
              {result.warnings.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "#FF3344" }}>⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Metadata fields */}
          {result.raw_fields?.length > 0 && (
            <div className="result-card">
              <p className="result-card-title">Metadata Fields ({result.raw_fields.length})</p>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {result.raw_fields.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{f.label}</td>
                      <td style={{ fontFamily: f.label.includes("Date") || f.label.includes("Time") ? "monospace" : undefined }}>
                        {f.value}
                      </td>
                      <td>
                        {f.risk && f.risk !== "low" && (
                          <span className={`result-badge ${f.risk === "high" ? "danger" : "warning"}`}>
                            {f.risk}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GPS map */}
          {result.has_gps && result.gps_lat && result.gps_lon && (
            <div className="result-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={14} style={{ color: "#FF3344" }} />
                <span className="result-card-title" style={{ margin: 0 }}>
                  GPS Location: {result.gps_lat.toFixed(6)}, {result.gps_lon.toFixed(6)}
                </span>
              </div>
              <div style={{ height: 260 }}>
                <MapContainer
                  center={[result.gps_lat, result.gps_lon]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" />
                  <CircleMarker
                    center={[result.gps_lat, result.gps_lon]}
                    radius={10}
                    pathOptions={{ color: "#FF3344", fillColor: "#FF3344", fillOpacity: 0.8, weight: 2 }}
                  >
                    <Popup><div style={{ fontFamily: "monospace", fontSize: 12 }}>{result.gps_lat.toFixed(6)}, {result.gps_lon.toFixed(6)}</div></Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!result && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <FileText size={40} className="text-muted" />
          <p className="text-muted">No file analyzed yet — drop a file or click to browse</p>
        </div>
      )}
    </div>
  );
}
