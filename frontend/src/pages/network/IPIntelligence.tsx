import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { LookupIPIntel, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { network } from "../../../wailsjs/go/models";
import "leaflet/dist/leaflet.css";

export default function IPIntelligence() {
  const [result, setResult] = useState<network.IPIntelResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await LookupIPIntel(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze this IP intelligence data and assess threat level:\n${JSON.stringify(result, null, 2)}`);
  };

  const getFlag = (code: string) =>
    code ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : "";

  return (
    <ToolPage
      title="IP Intelligence"
      description="Location, ISP, ASN, VPN/Tor/Proxy detection"
      placeholder="8.8.8.8 or 2001:4860:4860::8888"
      onQuery={handleQuery}
      loading={loading}
      toolName="ipintelligence"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          {result.error ? (
            <div className="result-card">
              <p style={{ color: "#FF3344" }}>{result.error}</p>
            </div>
          ) : (
            <>
              <div className="result-card">
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 32 }}>{getFlag(result.country_code)}</span>
                      <div>
                        <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
                          {result.ip}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                          {result.city}{result.city && result.country ? ", " : ""}{result.country}
                        </div>
                      </div>
                    </div>
                    <div className="result-grid">
                      {[
                        ["ISP", result.isp],
                        ["Organization", result.org],
                        ["ASN", result.as],
                        ["Timezone", result.timezone],
                        ["Region", result.region_name],
                        ["Postal", result.zip],
                        ["Coordinates", result.lat && result.lon ? `${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}` : ""],
                      ].map(([label, value]) =>
                        value ? (
                          <div key={label} className="result-row">
                            <span className="result-label">{label}</span>
                            <span className="result-value">{value}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Proxy", value: result.is_proxy },
                      { label: "Tor", value: result.is_tor },
                      { label: "Hosting", value: result.is_hosting },
                      { label: "Mobile", value: result.mobile },
                    ].map(({ label, value }) => (
                      <span key={label} className={`result-badge ${value ? "danger" : "success"}`}>
                        {label}: {value ? "Yes" : "No"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {result.lat && result.lon && (
                <div className="result-card" style={{ padding: 0, overflow: "hidden", height: 280 }}>
                  <MapContainer
                    center={[result.lat, result.lon]}
                    zoom={10}
                    style={{ height: "100%", width: "100%", background: "#06060F" }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    />
                    <CircleMarker
                      center={[result.lat, result.lon]}
                      radius={10}
                      pathOptions={{ color: "#00FF88", fillColor: "#00FF88", fillOpacity: 0.8, weight: 2 }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                          <strong>{result.ip}</strong><br />
                          {result.city}, {result.country}<br />
                          {result.isp}
                        </div>
                      </Popup>
                    </CircleMarker>
                  </MapContainer>
                </div>
              )}
            </>
          )}
        </>
      )}
    </ToolPage>
  );
}
