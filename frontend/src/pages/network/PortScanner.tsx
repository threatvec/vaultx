import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScanPorts, QueryAI } from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import ToolPage from "../../components/ToolPage";
import type { network } from "../../../wailsjs/go/models";

const RISKY_PORTS = new Set([
  21, 23, 69, 135, 139, 161, 445, 512, 513, 514, 1080, 1433, 1521,
  2375, 3389, 4444, 5900, 5984, 6379, 7001, 8888, 9200, 11211, 27017, 50070,
]);

export default function PortScanner() {
  const [result, setResult] = useState<network.PortScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [portRange, setPortRange] = useState("");
  const [progress, setProgress] = useState({ scanned: 0, total: 0, found: 0 });

  useEffect(() => {
    const cancel = EventsOn("portscan:progress", (p: { scanned: number; total: number; found: number }) => {
      setProgress(p);
    });
    return () => cancel();
  }, []);

  const handleQuery = async (input: string) => {
    setLoading(true);
    setProgress({ scanned: 0, total: 0, found: 0 });
    try {
      const r = await ScanPorts(input, portRange.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const handleAI = async () => {
    if (!result?.open_ports?.length) return;
    await QueryAI(`Analyze these open ports and assess security risks:\nTarget: ${result.target}\nOpen ports: ${JSON.stringify(result.open_ports, null, 2)}`);
  };

  const pct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0;

  return (
    <ToolPage
      title="Port Scanner"
      description="Async TCP port scanner — top 1000 ports or custom range"
      placeholder="192.168.1.1 or example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="portscanner"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={portRange}
          onChange={(e) => setPortRange(e.target.value)}
          placeholder="Custom port range (e.g. 80,443,1000-2000) — leave blank for top 1000"
          className="tool-input"
          style={{ width: "100%" }}
        />
      </div>

      {loading && (
        <div className="result-card">
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span className="text-secondary">Scanning ports...</span>
            <span style={{ color: "var(--accent)" }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: "var(--accent)", borderRadius: 3 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            {progress.scanned}/{progress.total} scanned — {progress.found} open
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="result-card">
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`result-badge ${result.total > 0 ? "warning" : "success"}`} style={{ fontSize: 15, padding: "6px 14px" }}>
                {result.total} open port{result.total !== 1 ? "s" : ""}
              </span>
              <span className="text-secondary" style={{ fontSize: 13 }}>
                {result.scanned} ports scanned on {result.target}
              </span>
              {result.start_time && result.end_time && (
                <span className="text-secondary" style={{ fontSize: 12 }}>
                  Duration: {Math.round((new Date(result.end_time as any).getTime() - new Date(result.start_time as any).getTime()) / 1000)}s
                </span>
              )}
            </div>
          </div>

          {result.open_ports?.length > 0 && (
            <div className="result-card">
              <p className="result-card-title">Open Ports</p>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Port</th>
                    <th>Service</th>
                    <th>Banner</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {result.open_ports.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "monospace", color: "var(--accent)", fontWeight: 600 }}>{p.port}</td>
                      <td>{p.service}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 11, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.banner || "—"}
                      </td>
                      <td>
                        {RISKY_PORTS.has(p.port) ? (
                          <span className="result-badge danger">High Risk</span>
                        ) : (
                          <span className="result-badge success">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.total === 0 && (
            <div className="result-card">
              <p style={{ color: "#00FF88" }}>No open ports found in scanned range</p>
            </div>
          )}
        </>
      )}
    </ToolPage>
  );
}
