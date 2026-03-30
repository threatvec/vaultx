import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import {
  PingHost,
  Traceroute,
  LookupDNSForward,
  LookupDNSReverse,
} from "../../../wailsjs/go/main/App";
import type { network } from "../../../wailsjs/go/models";

type Tab = "ping" | "traceroute" | "dns" | "reverse";

export default function NetworkTools() {
  const [tab, setTab] = useState<Tab>("ping");
  const [input, setInput] = useState("");
  const [pingCount, setPingCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  const log = (line: string) => setLines((prev) => [...prev, line]);
  const clear = () => setLines([]);

  const handleRun = async () => {
    if (!input.trim()) return;
    clear();
    setLoading(true);
    try {
      if (tab === "ping") {
        log(`> Pinging ${input} (${pingCount} probes)...`);
        const r: network.PingResult = await PingHost(input.trim(), pingCount);
        if (r.error) {
          log(`Error: ${r.error}`);
        } else {
          log(`Resolved to: ${r.ip}`);
          r.rtts?.forEach((rtt, i) => log(`[${i + 1}] ${rtt}`));
          log(`---`);
          log(`Sent: ${r.sent}  Received: ${r.received}  Packet loss: ${r.packet_loss?.toFixed(1)}%`);
          if (r.avg_rtt) {
            const toMs = (ns: number) => (ns / 1_000_000).toFixed(2) + " ms";
            log(`Min: ${toMs(r.min_rtt as any)}  Avg: ${toMs(r.avg_rtt as any)}  Max: ${toMs(r.max_rtt as any)}`);
          }
        }
      } else if (tab === "traceroute") {
        log(`> Traceroute to ${input}...`);
        const r: network.TracerouteResult = await Traceroute(input.trim());
        if (r.error) {
          log(`Error: ${r.error}`);
        } else {
          r.hops?.forEach((hop) => {
            const host = hop.hostname ? `${hop.ip} (${hop.hostname})` : hop.ip;
            const location = hop.city || hop.country_code ? ` — ${[hop.city, hop.country_code].filter(Boolean).join(", ")}` : "";
            log(`${String(hop.ttl).padStart(3)}  ${host}  ${hop.rtt}${location}`);
          });
        }
      } else if (tab === "dns") {
        log(`> DNS Forward Lookup: ${input}`);
        const r: network.DNSLookupResult = await LookupDNSForward(input.trim());
        if (r.error) {
          log(`Error: ${r.error}`);
        } else {
          r.ips?.forEach((ip) => log(`  ${ip}`));
          if (!r.ips?.length) log("  No records found");
        }
      } else if (tab === "reverse") {
        log(`> Reverse DNS Lookup: ${input}`);
        const r: network.ReverseDNSResult = await LookupDNSReverse(input.trim());
        if (r.error) {
          log(`Error: ${r.error}`);
        } else {
          r.hostnames?.forEach((h) => log(`  ${h}`));
          if (!r.hostnames?.length) log("  No PTR record found");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; placeholder: string }[] = [
    { id: "ping", label: "Ping", placeholder: "8.8.8.8 or example.com" },
    { id: "traceroute", label: "Traceroute", placeholder: "8.8.8.8 or example.com" },
    { id: "dns", label: "DNS Forward", placeholder: "example.com" },
    { id: "reverse", label: "Reverse DNS", placeholder: "8.8.8.8" },
  ];

  const current = tabs.find((t) => t.id === tab)!;

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Network Tools</h1>
        <p className="text-secondary">Ping, traceroute, DNS forward & reverse lookup</p>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => { setTab(t.id); clear(); setInput(""); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleRun()}
          placeholder={current.placeholder}
          className="tool-input"
          style={{ flex: 1 }}
        />
        {tab === "ping" && (
          <select
            value={pingCount}
            onChange={(e) => setPingCount(Number(e.target.value))}
            className="tool-input"
            style={{ width: 80 }}
          >
            {[2, 4, 6, 8, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
        <button className="tool-scan-btn" onClick={handleRun} disabled={loading || !input.trim()}>
          {loading ? (
            <span className="animate-spin" style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "currentColor" }} />
          ) : (
            "Run"
          )}
        </button>
      </div>

      <div
        className="result-card"
        style={{ marginTop: 16, minHeight: 300, fontFamily: "monospace", fontSize: 13 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Terminal size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Output</span>
          {lines.length > 0 && (
            <button
              onClick={clear}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11 }}
            >
              Clear
            </button>
          )}
        </div>
        {lines.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 12 }}>Enter a target and click Run</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith(">") ? "var(--accent)" :
                    line.startsWith("Error") ? "#FF3344" :
                    line.startsWith("---") ? "var(--border)" :
                    "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {line}
              </div>
            ))}
            {loading && (
              <div style={{ color: "var(--text-muted)" }}>_</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
