import { useState } from "react";
import { Mail, AlertTriangle, CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import { ParseEmailHeader } from "../../../wailsjs/go/main/App";
import type { auth } from "../../../wailsjs/go/models";

const PHISH_COLOR = (score: number) => {
  if (score >= 70) return "#FF3344";
  if (score >= 40) return "#FF6633";
  if (score >= 20) return "#FFB800";
  return "#00FF88";
};

function AuthBadge({ present, pass, label, result }: { present: boolean; pass: boolean; label: string; result: string }) {
  const color = !present ? "#888" : pass ? "#00FF88" : "#FF3344";
  const Icon = !present ? XCircle : pass ? CheckCircle : XCircle;
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        border: `1px solid ${color}30`,
        background: color + "08",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 12, color, textTransform: "uppercase", fontWeight: 700 }}>
        {result || (present ? (pass ? "PASS" : "FAIL") : "NONE")}
      </div>
    </div>
  );
}

export default function EmailHeader() {
  const [rawHeader, setRawHeader] = useState("");
  const [result, setResult] = useState<auth.EmailHeaderResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!rawHeader.trim()) return;
    setLoading(true);
    try {
      const r = await ParseEmailHeader(rawHeader);
      setResult(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const phishColor = result ? PHISH_COLOR(result.phish_score ?? 0) : "#888";

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Email Header Analyzer</h1>
        <p className="text-secondary">SPF · DKIM · DMARC · Source IP chain · Phishing score</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <textarea
          value={rawHeader}
          onChange={(e) => setRawHeader(e.target.value)}
          placeholder={"Paste raw email headers here...\n\nReceived: from mail.example.com ([192.168.1.1])\nFrom: sender@example.com\nTo: recipient@example.com\nSubject: Test email\nDKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=default..."}
          style={{
            width: "100%",
            height: 180,
            padding: "12px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "monospace",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          className="tool-scan-btn"
          onClick={handleAnalyze}
          disabled={loading || !rawHeader.trim()}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>
              <Mail size={15} /> Analyze Headers
            </>
          )}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          {/* Phishing risk score */}
          <div className="result-card" style={{ borderColor: phishColor + "40" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Shield size={28} style={{ color: phishColor }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: phishColor }}>
                  Phishing Risk Score: {result.phish_score}/100
                </div>
                <div className="text-secondary" style={{ fontSize: 12 }}>
                  {(result.phish_score ?? 0) >= 70
                    ? "High risk — likely phishing or spoofed"
                    : (result.phish_score ?? 0) >= 40
                    ? "Medium risk — some suspicious indicators"
                    : (result.phish_score ?? 0) >= 20
                    ? "Low risk — minor issues detected"
                    : "Clean — no phishing indicators found"}
                </div>
              </div>
            </div>
            {result.phish_reasons && result.phish_reasons.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                {result.phish_reasons.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={12} style={{ color: phishColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email metadata */}
          {(result.from || result.to || result.subject || result.date) && (
            <div className="result-card">
              <p className="result-card-title">Email Metadata</p>
              <div className="result-grid">
                {[
                  ["From", result.from],
                  ["To", result.to],
                  ["Subject", result.subject],
                  ["Date", result.date],
                  ["Message-ID", result.message_id],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="result-row">
                      <span className="result-label">{label}</span>
                      <span className="result-value" style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
                        {value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SPF / DKIM / DMARC */}
          <div className="result-card">
            <p className="result-card-title">Authentication Results</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <AuthBadge
                present={result.spf?.present ?? false}
                pass={result.spf?.pass ?? false}
                label="SPF"
                result={result.spf?.result ?? ""}
              />
              <AuthBadge
                present={result.dkim?.present ?? false}
                pass={result.dkim?.pass ?? false}
                label="DKIM"
                result={result.dkim?.result ?? ""}
              />
              <AuthBadge
                present={result.dmarc?.present ?? false}
                pass={result.dmarc?.pass ?? false}
                label="DMARC"
                result={result.dmarc?.result ?? ""}
              />
            </div>
            {/* Additional detail */}
            <div style={{ marginTop: 12 }} className="result-grid">
              {result.spf?.domain && (
                <div className="result-row">
                  <span className="result-label">SPF Domain</span>
                  <span className="result-value">{result.spf.domain}</span>
                </div>
              )}
              {result.dkim?.domain && (
                <div className="result-row">
                  <span className="result-label">DKIM Domain</span>
                  <span className="result-value">{result.dkim.domain}</span>
                </div>
              )}
              {result.dkim?.selector && (
                <div className="result-row">
                  <span className="result-label">DKIM Selector</span>
                  <span className="result-value">{result.dkim.selector}</span>
                </div>
              )}
              {result.dmarc?.policy && (
                <div className="result-row">
                  <span className="result-label">DMARC Policy</span>
                  <span className="result-value">{result.dmarc.policy}</span>
                </div>
              )}
            </div>
          </div>

          {/* IP Routing Chain */}
          {result.ip_chain && result.ip_chain.length > 0 && (
            <div className="result-card">
              <p className="result-card-title">IP Routing Chain ({result.ip_chain.length} hops)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.ip_chain.map((hop, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 12px",
                      background: "var(--bg-hover)",
                      borderRadius: 6,
                      borderLeft: `3px solid ${hop.is_public ? "var(--accent)" : "var(--text-muted)"}`,
                    }}
                  >
                    <span
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        padding: "1px 7px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {hop.ip && (
                        <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--accent)" }}>
                          {hop.ip}
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: hop.is_public ? "#00FF8815" : "var(--bg-hover)",
                              color: hop.is_public ? "#00FF88" : "var(--text-muted)",
                              border: `1px solid ${hop.is_public ? "#00FF8830" : "var(--border)"}`,
                            }}
                          >
                            {hop.is_public ? "Public" : "Private"}
                          </span>
                        </div>
                      )}
                      {hop.from && <div className="text-secondary" style={{ fontSize: 11 }}>From: {hop.from}</div>}
                      {hop.by && <div className="text-secondary" style={{ fontSize: 11 }}>By: {hop.by}</div>}
                      {hop.timestamp && <div className="text-muted" style={{ fontSize: 11 }}>{hop.timestamp}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Mail size={40} className="text-muted" />
          <p className="text-muted">Paste raw email headers above to analyze</p>
        </div>
      )}
    </div>
  );
}
