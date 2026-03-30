import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Wifi, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { GetMyIP } from "../../../wailsjs/go/main/App";
import type { network } from "../../../wailsjs/go/models";

export default function MyIPInfo() {
  const [result, setResult] = useState<network.MyIPResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await GetMyIP();
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const getFlag = (code: string) =>
    code ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : "";

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>My IP Info</h1>
            <p className="text-secondary">Your public IP, ISP, and DNS leak test</p>
          </div>
          <button className="tool-action-btn" onClick={load} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {loading && !result && (
        <div style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-row" style={{ marginBottom: 12 }} />
          ))}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginTop: 24 }}
        >
          {result.error ? (
            <div className="result-card">
              <p style={{ color: "#FF3344" }}>{result.error}</p>
            </div>
          ) : (
            <>
              {/* Main IP card */}
              <div className="result-card">
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <Wifi size={32} style={{ color: "var(--accent)" }} />
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>
                      {result.public_ip}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                      {getFlag(result.country_code)} {result.city}{result.city && result.country ? ", " : ""}{result.country}
                    </div>
                  </div>
                </div>
                <div className="result-grid">
                  {[
                    ["ISP", result.isp],
                    ["Organization", result.org],
                    ["ASN", result.as],
                    ["Timezone", result.timezone],
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

              {/* Privacy flags */}
              <div className="result-card">
                <p className="result-card-title">
                  <Shield size={16} />
                  Privacy Flags
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { label: "VPN", value: result.is_vpn },
                    { label: "Proxy", value: result.is_proxy },
                    { label: "Tor", value: result.is_tor },
                  ].map(({ label, value }) => (
                    <span key={label} className={`result-badge ${value ? "warning" : "success"}`}>
                      {label}: {value ? "Detected" : "Not Detected"}
                    </span>
                  ))}
                </div>
              </div>

              {/* DNS Leak */}
              <div className="result-card">
                <p className="result-card-title">
                  <AlertTriangle size={16} style={{ color: result.has_dns_leak ? "#FF3344" : "#00FF88" }} />
                  DNS Leak Test
                </p>
                <div style={{ marginBottom: 12 }}>
                  <span className={`result-badge ${result.has_dns_leak ? "danger" : "success"}`} style={{ fontSize: 14, padding: "6px 14px" }}>
                    {result.has_dns_leak ? "DNS Leak Detected" : "No DNS Leak"}
                  </span>
                </div>
                {result.dns_leaks?.length > 0 && (
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>DNS Server IP</th>
                        <th>Country</th>
                        <th>ISP</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.dns_leaks.map((leak, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>{leak.ip}</td>
                          <td>{leak.country_code || "—"}</td>
                          <td className="text-secondary">{leak.isp || "—"}</td>
                          <td>
                            <span className={`result-badge ${leak.is_same_isp ? "success" : "warning"}`}>
                              {leak.is_same_isp ? "Same ISP" : "Different ISP"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(!result.dns_leaks || result.dns_leaks.length === 0) && (
                  <p className="text-muted" style={{ fontSize: 13 }}>No DNS resolvers detected</p>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
