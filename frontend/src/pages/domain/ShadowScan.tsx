import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Loader2, Radar, Globe, Server, Lock, Search, FileDown, FileJson } from "lucide-react";
import {
  RunShadowScan,
  ExportShadowScanPDF,
  QueryAI,
} from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import type { domain } from "../../../wailsjs/go/models";

interface ProgressLog {
  module: string;
  message: string;
  percent: number;
}

export default function ShadowScan() {
  const { t } = useTranslation();
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<domain.ShadowScanResult | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [config, setConfig] = useState({
    subdomains: true,
    ports: true,
    dns: true,
    ssl: true,
    dorks: true,
  });
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cancel = EventsOn("shadowscan:progress", (p: ProgressLog) => {
      setLogs((prev) => [...prev, p]);
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancel();
  }, []);

  const handleScan = async () => {
    if (!target.trim()) return;
    setLoading(true);
    setLogs([]);
    setResult(null);
    setActiveTab("summary");

    try {
      const r = await RunShadowScan({
        target: target.trim(),
        subdomains: config.subdomains,
        ports: config.ports,
        dns: config.dns,
        ssl: config.ssl,
        dorks: config.dorks,
      } as any);
      setResult(r);
    } catch (err: any) {
      setLogs((prev) => [...prev, { module: "error", message: String(err), percent: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    try {
      const bytes = await ExportShadowScanPDF(result as any);
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shadowscan-${target}.pdf`;
      a.click();
    } catch {}
  };

  const handleExportJSON = () => {
    if (!result) return;
    const json = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(json);
  };

  const getRiskClass = (score: number) => {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "subdomains", label: `Subdomains (${result?.subdomains?.length || 0})` },
    { key: "ports", label: `Ports (${result?.ports?.length || 0})` },
    { key: "dns", label: "DNS" },
    { key: "ssl", label: "SSL" },
    { key: "dorks", label: "Dorks" },
  ];

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>ShadowScan</h1>
        <p className="text-secondary">Full attack surface scan — subdomain, port, DNS, SSL, CVE, dorks</p>
      </motion.div>

      <div className="tool-input-section">
        <div className="tool-input-form">
          <div className="tool-input-wrapper">
            <Radar size={18} className="tool-input-icon" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="example.com"
              disabled={loading}
              className="tool-input"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
          </div>
          <button className="tool-scan-btn" onClick={handleScan} disabled={loading || !target.trim()}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Radar size={18} />}
            <span>{loading ? "Scanning..." : "Start Scan"}</span>
          </button>
        </div>

        <div className="shadowscan-config">
          {Object.entries(config).map(([key, val]) => (
            <label key={key} className="config-toggle">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
                disabled={loading}
              />
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      {(loading || logs.length > 0) && (
        <div className="terminal-log">
          {logs.map((log, i) => (
            <div key={i} className={`terminal-line ${log.module === "error" ? "error" : log.module === "complete" ? "success" : ""}`}>
              <span className="text-muted">[{log.module}]</span> {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="tool-actions">
            <button className="tool-action-btn" onClick={handleExportPDF}>
              <FileDown size={14} />
              <span>Export PDF</span>
            </button>
            <button className="tool-action-btn" onClick={handleExportJSON}>
              <FileJson size={14} />
              <span>Copy JSON</span>
            </button>
          </div>

          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "summary" && (
            <div className="result-grid" style={{ gridTemplateColumns: "auto 1fr" }}>
              <div className="score-gauge">
                <div className={`score-circle ${getRiskClass(result.risk_score)}`}>
                  {result.risk_score}
                </div>
                <span className="text-secondary" style={{ fontSize: 12 }}>Risk Score</span>
              </div>
              <div className="result-card">
                <div className="result-grid">
                  <div className="result-row">
                    <span className="result-label">Target</span>
                    <span className="result-value">{result.target}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Duration</span>
                    <span className="result-value">
                      {result.finished_at && result.started_at
                        ? `${Math.round((new Date(result.finished_at).getTime() - new Date(result.started_at).getTime()) / 1000)}s`
                        : "-"}
                    </span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Subdomains Found</span>
                    <span className="result-value" style={{ color: "var(--accent)" }}>{result.subdomains?.length || 0}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Open Ports</span>
                    <span className="result-value" style={{ color: "#FFB800" }}>{result.ports?.length || 0}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">SSL Valid</span>
                    <span className="result-value">
                      <span className={`result-badge ${result.ssl?.valid ? "success" : "danger"}`}>
                        {result.ssl?.valid ? "Valid" : "Invalid"}
                      </span>
                    </span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">SSL Score</span>
                    <span className="result-value">{result.ssl?.security_score ?? "-"}/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "subdomains" && (
            <div className="result-card">
              {!result.subdomains?.length ? (
                <p className="text-muted">No subdomains found</p>
              ) : (
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Subdomain</th>
                      <th>IP Addresses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subdomains.map((s, i) => (
                      <tr key={i}>
                        <td>{s.subdomain}</td>
                        <td>{s.ips?.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "ports" && (
            <div className="result-card">
              {!result.ports?.length ? (
                <p className="text-muted">No open ports found</p>
              ) : (
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Port</th>
                      <th>Service</th>
                      <th>Banner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ports.map((p, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--accent-amber)" }}>{p.port}</td>
                        <td>{p.service}</td>
                        <td>{p.banner || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "dns" && result.dns && (
            <div className="result-card">
              {[
                { label: "A Records", items: result.dns.a },
                { label: "AAAA Records", items: result.dns.aaaa },
                { label: "MX Records", items: result.dns.mx },
                { label: "NS Records", items: result.dns.ns },
                { label: "TXT Records", items: result.dns.txt },
              ].map(({ label, items }) =>
                items?.length ? (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <p className="result-label" style={{ marginBottom: 6 }}>{label}</p>
                    {items.map((r: any, i: number) => (
                      <div key={i} className="result-value" style={{ marginBottom: 4 }}>{r.value}</div>
                    ))}
                  </div>
                ) : null
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <span className={`result-badge ${result.dns.spf ? "success" : "danger"}`}>
                  {result.dns.spf ? "SPF ✓" : "No SPF"}
                </span>
                <span className={`result-badge ${result.dns.dmarc ? "success" : "danger"}`}>
                  {result.dns.dmarc ? "DMARC ✓" : "No DMARC"}
                </span>
                <span className={`result-badge ${result.dns.has_dkim ? "success" : "danger"}`}>
                  {result.dns.has_dkim ? "DKIM ✓" : "No DKIM"}
                </span>
              </div>
            </div>
          )}

          {activeTab === "ssl" && result.ssl && (
            <div className="result-card">
              <div className="result-grid">
                <div className="result-row">
                  <span className="result-label">Subject</span>
                  <span className="result-value">{result.ssl.subject}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Issuer</span>
                  <span className="result-value">{result.ssl.issuer}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Protocol</span>
                  <span className="result-value">{result.ssl.protocol}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Days Until Expiry</span>
                  <span className={`result-value ${result.ssl.expiry_warning ? "text-warning" : ""}`}>
                    {result.ssl.days_until_expiry}
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-label">Cipher Suite</span>
                  <span className="result-value">{result.ssl.cipher_suite}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Security Score</span>
                  <span className="result-value">{result.ssl.security_score}/100</span>
                </div>
              </div>
              {result.ssl.issues?.length ? (
                <div style={{ marginTop: 16 }}>
                  <p className="result-label" style={{ marginBottom: 8 }}>Issues</p>
                  {result.ssl.issues.map((issue: string, i: number) => (
                    <div key={i} className="result-badge danger" style={{ marginBottom: 6, display: "inline-flex", marginRight: 8 }}>
                      {issue}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {activeTab === "dorks" && result.dorks && (
            <div className="result-card">
              {result.dorks.map((cat: any, i: number) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <p className="result-label" style={{ marginBottom: 8 }}>{cat.name}</p>
                  {cat.dorks.map((dork: string, j: number) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <code className="result-value" style={{ flex: 1, fontSize: 12 }}>{dork}</code>
                      <button
                        className="tool-action-btn"
                        style={{ padding: "4px 10px" }}
                        onClick={() => navigator.clipboard.writeText(dork)}
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
