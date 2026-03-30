import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Image, Upload, MapPin, AlertTriangle } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { ExtractImageEXIF, OpenImageDialog, ReadFileAsBase64, QueryAI } from "../../../wailsjs/go/main/App";
import type { files } from "../../../wailsjs/go/models";
import "leaflet/dist/leaflet.css";

export default function ImageEXIF() {
  const [result, setResult] = useState<files.EXIFResult | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFile = async (path: string) => {
    setLoading(true);
    try {
      const [exif, b64] = await Promise.all([
        ExtractImageEXIF(path),
        ReadFileAsBase64(path).catch(() => ""),
      ]);
      setResult(exif);
      if (b64) setPreview(`data:image/jpeg;base64,${b64}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async () => {
    const path = await OpenImageDialog("Select Image for EXIF Analysis");
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
    await QueryAI(`Analyze this EXIF data and identify privacy risks:\n${JSON.stringify(result, null, 2)}`);
  };

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Image EXIF Analyzer</h1>
        <p className="text-secondary">Extract GPS, camera, and timestamp data from images</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 16, marginTop: 24 }}>
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
            padding: preview ? 0 : 40,
            textAlign: "center",
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
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover", maxHeight: 320 }}
            />
          ) : (
            <div>
              <Upload size={36} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600 }}>Drop image or click to browse</p>
              <p className="text-muted" style={{ fontSize: 12 }}>JPG, PNG, TIFF, WebP, GIF</p>
            </div>
          )}
        </motion.div>

        {/* EXIF data */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Camera + GPS badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.make && <span className="result-badge info">{result.make}</span>}
              {result.model && <span className="result-badge info">{result.model}</span>}
              {result.date_time && <span className="result-badge success">{result.date_time}</span>}
              {result.has_gps && <span className="result-badge danger"><MapPin size={11} /> GPS Data Present</span>}
            </div>

            {/* AI button */}
            <button className="tool-action-btn" onClick={handleAI} style={{ alignSelf: "flex-start" }}>
              AI Analyze
            </button>

            {result.has_gps && result.gps_lat && result.gps_lon && (
              <div style={{ borderRadius: 8, overflow: "hidden", height: 160, border: "1px solid var(--border)" }}>
                <MapContainer
                  center={[result.gps_lat, result.gps_lon]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" />
                  <CircleMarker
                    center={[result.gps_lat, result.gps_lon]}
                    radius={10}
                    pathOptions={{ color: "#FF3344", fillColor: "#FF3344", fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                        {result.gps_lat.toFixed(6)}, {result.gps_lon.toFixed(6)}
                      </div>
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ marginTop: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" style={{ marginBottom: 8 }} />)}
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
          {result.error && !result.fields?.length ? (
            <div className="result-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFB800" }}>
                <AlertTriangle size={16} />
                <span>{result.error}</span>
              </div>
            </div>
          ) : (
            <div className="result-card">
              <p className="result-card-title">EXIF Fields ({result.fields?.length || 0})</p>
              {result.fields?.length ? (
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Value</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.fields.map((f, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{f.label}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{f.value}</td>
                        <td>
                          {f.risk === "high" && <span className="result-badge danger">High</span>}
                          {f.risk === "medium" && <span className="result-badge warning">Medium</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted" style={{ fontSize: 13 }}>No EXIF data found in this image</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {!result && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Image size={40} className="text-muted" />
          <p className="text-muted">Drop an image to extract EXIF metadata</p>
        </div>
      )}
    </div>
  );
}
