import { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Plus, Trash2, Globe, Loader2 } from "lucide-react";
import { LookupGeoMap } from "../../../wailsjs/go/main/App";
import type { network } from "../../../wailsjs/go/models";
import "leaflet/dist/leaflet.css";

export default function GeoMap() {
  const [ips, setIps] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<network.GeoMapResult | null>(null);
  const [loading, setLoading] = useState(false);

  const addIP = () => {
    const ip = inputValue.trim();
    if (ip && !ips.includes(ip)) {
      setIps((prev) => [...prev, ip]);
      setInputValue("");
    }
  };

  const removeIP = (ip: string) => {
    setIps((prev) => prev.filter((i) => i !== ip));
  };

  const handleScan = async () => {
    if (ips.length === 0) return;
    setLoading(true);
    try {
      const r = await LookupGeoMap(ips);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#00FF88", "#0066FF", "#FF3344", "#FFB800", "#FF3399", "#9944FF", "#00CCFF"];

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>IP Geolocation Map</h1>
        <p className="text-secondary">Map and compare multiple IP addresses on the globe</p>
      </motion.div>

      <div className="result-card" style={{ marginTop: 24 }}>
        <p className="result-card-title">
          <Plus size={16} />
          Add IP Addresses
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIP()}
            placeholder="Enter IP address..."
            className="tool-input"
            style={{ flex: 1 }}
          />
          <button className="tool-scan-btn" onClick={addIP} disabled={!inputValue.trim()}>
            <Plus size={16} />
          </button>
          <button
            className="tool-scan-btn"
            onClick={handleScan}
            disabled={loading || ips.length === 0}
            style={{ minWidth: 100 }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Globe size={16} /><span>Map All</span></>}
          </button>
        </div>

        {ips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ips.map((ip, i) => (
              <div
                key={ip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "var(--bg-hover)",
                  borderRadius: 6,
                  border: `1px solid ${COLORS[i % COLORS.length]}40`,
                }}
              >
                <span
                  style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }}
                />
                <span style={{ fontFamily: "monospace", fontSize: 13 }}>{ip}</span>
                <button
                  onClick={() => removeIP(ip)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, lineHeight: 1 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ marginTop: 16, height: 460, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%", background: "#06060F" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />
          {result?.points?.filter((p) => p.lat && p.lon).map((point, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <CircleMarker
                key={i}
                center={[point.lat, point.lon]}
                radius={10}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
              >
                <Popup>
                  <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                    <strong>{point.ip}</strong><br />
                    {point.city}{point.city && point.country ? ", " : ""}{point.country}<br />
                    {point.isp}<br />
                    {point.as}
                    {point.is_proxy && <><br /><span style={{ color: "#FF3344" }}>⚠ Proxy</span></>}
                    {point.is_hosting && <><br /><span style={{ color: "#FFB800" }}>⚠ Hosting</span></>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </motion.div>

      {result?.points && result.points.length > 0 && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <p className="result-card-title">Results ({result.total})</p>
          <table className="result-table">
            <thead>
              <tr>
                <th></th>
                <th>IP</th>
                <th>City</th>
                <th>Country</th>
                <th>ISP</th>
                <th>ASN</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {result.points.map((p, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                  </td>
                  <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>{p.ip}</td>
                  <td>{p.city || "—"}</td>
                  <td>{p.country_code || "—"}</td>
                  <td className="text-secondary">{p.isp || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.as || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.is_proxy && <span className="result-badge danger">Proxy</span>}
                      {p.is_hosting && <span className="result-badge warning">Hosting</span>}
                      {p.is_tor && <span className="result-badge danger">Tor</span>}
                      {!p.is_proxy && !p.is_hosting && !p.is_tor && <span className="result-badge success">Clean</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!result && ips.length === 0 && (
        <div className="tool-empty">
          <Globe size={40} className="text-muted" />
          <p className="text-muted">Add IP addresses and click Map All to visualize their locations</p>
        </div>
      )}
    </div>
  );
}
