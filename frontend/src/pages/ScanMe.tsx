import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Shield,
  Wifi,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Server,
} from "lucide-react";
import { RunSelfScan } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import ShareCard from "../components/ShareCard";

interface ScanStep {
  name: string;
  status: string;
  message: string;
}

interface SelfScanResult {
  public_ip: string;
  isp: string;
  country: string;
  city: string;
  is_vpn: boolean;
  is_tor: boolean;
  is_proxy: boolean;
  dns_leak: string[];
  webrtc_leak: string[];
  open_ports: number[];
  security_score: number;
  issues: string[];
  suggestions: string[];
  scan_duration: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  "IP Detection": Globe,
  "DNS Leak Check": Shield,
  "WebRTC Check": Eye,
  "Port Scan": Wifi,
  "Scoring": Server,
};

export default function ScanMe() {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<SelfScanResult | null>(null);
  const [steps, setSteps] = useState<ScanStep[]>([]);

  useEffect(() => {
    const cancel = EventsOn("scanme:progress", (step: ScanStep) => {
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.name === step.name);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = step;
          return next;
        }
        return [...prev, step];
      });
    });
    return () => cancel();
  }, []);

  const startScan = async () => {
    setScanning(true);
    setResult(null);
    setSteps([]);
    try {
      const r = await RunSelfScan();
      setResult(r);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#00FF88";
    if (score >= 60) return "#FFB800";
    if (score >= 40) return "#FF6633";
    return "#FF3344";
  };

  const getScoreVariant = (score: number): "success" | "warning" | "danger" => {
    if (score >= 80) return "success";
    if (score >= 50) return "warning";
    return "danger";
  };

  const scoreColor = result ? getScoreColor(result.security_score) : "#00FF88";

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>{t("sidebar.scanMe")}</h1>
        <p className="text-secondary">{t("dashboard.scanMeDesc")}</p>
      </motion.div>

      <div className="scan-me-content">
        {!result && !scanning && (
          <motion.button
            className="scan-me-big-btn"
            onClick={startScan}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ScanLine size={64} />
            <span>{t("dashboard.scanMe")}</span>
          </motion.button>
        )}

        {scanning && (
          <motion.div
            className="scan-progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 size={48} className="animate-spin" style={{ color: "var(--accent)" }} />
            <p style={{ marginTop: 12, fontWeight: 500 }}>Scanning your security posture...</p>
            <div className="scan-steps" style={{ marginTop: 20 }}>
              {steps.map((step, i) => {
                const StepIcon = STEP_ICONS[step.name] || Shield;
                return (
                  <motion.div
                    key={step.name}
                    className={`scan-step ${step.status === "running" ? "active" : ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}
                  >
                    {step.status === "running" && <Loader2 size={14} className="animate-spin" style={{ color: "#FFB800" }} />}
                    {step.status === "done" && <CheckCircle size={14} style={{ color: "#00FF88" }} />}
                    {step.status === "error" && <XCircle size={14} style={{ color: "#FF3344" }} />}
                    <StepIcon size={14} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{step.name}</span>
                    <span className="text-secondary" style={{ fontSize: 12 }}>{step.message}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {result && !scanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Score hero */}
              <div
                className="result-card"
                style={{
                  textAlign: "center",
                  borderColor: scoreColor + "40",
                  padding: "30px 20px",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    color: scoreColor,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {result.security_score}
                </div>
                <div style={{ fontSize: 14, color: scoreColor, fontWeight: 600, marginBottom: 4 }}>
                  / 100 Security Score
                </div>
                <div className="text-secondary" style={{ fontSize: 12 }}>
                  Scan completed in {result.scan_duration}
                </div>
              </div>

              {/* IP info */}
              <div className="result-card">
                <p className="result-card-title">Your Network</p>
                <div className="result-grid">
                  {[
                    ["Public IP", result.public_ip],
                    ["ISP", result.isp],
                    ["Location", [result.city, result.country].filter(Boolean).join(", ")],
                    ["VPN/Proxy", result.is_vpn || result.is_proxy ? "Active" : "Not detected"],
                    ["Tor", result.is_tor ? "Detected" : "No"],
                  ].map(([label, value]) => (
                    <div key={label as string} className="result-row">
                      <span className="result-label">{label}</span>
                      <span className="result-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Ports */}
              {result.open_ports && result.open_ports.length > 0 && (
                <div className="result-card" style={{ borderColor: "#FFB80030" }}>
                  <p className="result-card-title" style={{ color: "#FFB800" }}>
                    Open Ports ({result.open_ports.length})
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.open_ports.map((port) => (
                      <span
                        key={port}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: "#FFB80015",
                          border: "1px solid #FFB80030",
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#FFB800",
                        }}
                      >
                        {port}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {result.issues && result.issues.length > 0 && (
                <div className="result-card" style={{ borderColor: "#FF334430" }}>
                  <p className="result-card-title" style={{ color: "#FF3344" }}>
                    Issues Found ({result.issues.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.issues.map((issue, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <AlertTriangle size={13} style={{ color: "#FF3344", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13 }}>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="result-card" style={{ borderColor: "#00FF8820" }}>
                  <p className="result-card-title" style={{ color: "#00FF88" }}>Recommendations</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.suggestions.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Shield size={13} style={{ color: "#00FF88", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Card */}
              <ShareCard
                title="Security Scan"
                score={result.security_score}
                variant={getScoreVariant(result.security_score)}
                data={{
                  "IP Address": result.public_ip,
                  "ISP": result.isp || "Unknown",
                  "Location": [result.city, result.country].filter(Boolean).join(", ") || "Unknown",
                  "VPN/Proxy": result.is_vpn || result.is_proxy ? "Active" : "Not detected",
                  "Open Ports": result.open_ports?.length > 0 ? result.open_ports.join(", ") : "None",
                  "Issues": result.issues?.length > 0 ? `${result.issues.length} found` : "None",
                }}
              />

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button className="btn-primary" onClick={startScan} style={{ padding: "10px 32px" }}>
                  <ScanLine size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Scan Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
