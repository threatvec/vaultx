import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldAlert, ShieldCheck, AlertCircle } from "lucide-react";
import { CheckEmailBreach, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { identity } from "../../../wailsjs/go/models";

const DATA_CLASS_COLORS: Record<string, string> = {
  "Passwords": "#FF3344",
  "Email addresses": "#FFB800",
  "Usernames": "#FF6633",
  "IP addresses": "#9944FF",
  "Phone numbers": "#FF3399",
  "Physical addresses": "#FF6633",
  "Credit cards": "#FF3344",
  "Social media profiles": "#0066FF",
  "Geographic locations": "#00CCFF",
  "Dates of birth": "#FFB800",
};

export default function EmailBreach() {
  const [result, setResult] = useState<identity.EmailBreachResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await CheckEmailBreach(input.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze these email breach findings and advise on security:\n${JSON.stringify(result, null, 2)}`);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  return (
    <ToolPage
      title="Email Breach Check"
      description="Check if your email has been in a data breach — powered by HaveIBeenPwned"
      placeholder="user@example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="emailbreach"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          {result.error ? (
            <div className="result-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFB800" }}>
                <AlertCircle size={16} />
                <span>{result.error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Summary banner */}
              <div
                className="result-card"
                style={{ borderColor: result.found ? "#FF334440" : "#00FF8840" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {result.found ? (
                    <ShieldAlert size={36} style={{ color: "#FF3344", flexShrink: 0 }} />
                  ) : (
                    <ShieldCheck size={36} style={{ color: "#00FF88", flexShrink: 0 }} />
                  )}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 20,
                        color: result.found ? "#FF3344" : "#00FF88",
                        marginBottom: 4,
                      }}
                    >
                      {result.found
                        ? `Found in ${result.breach_count} breach${result.breach_count !== 1 ? "es" : ""}!`
                        : "No breaches found"}
                    </div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>
                      {result.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Breach cards */}
              {result.breaches?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
                  <AnimatePresence>
                    {result.breaches.map((breach, i) => (
                      <motion.div
                        key={breach.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="result-card"
                        style={{ borderColor: "#FF334430" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#FF3344", marginBottom: 2 }}>
                              {breach.title || breach.name}
                            </div>
                            <div className="text-secondary" style={{ fontSize: 12 }}>
                              {breach.domain} · Breach date: {breach.breach_date || "Unknown"}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            {breach.is_verified && <span className="result-badge danger">Verified</span>}
                            {breach.is_sensitive && <span className="result-badge warning">Sensitive</span>}
                            {breach.pwn_count > 0 && (
                              <span className="result-badge info" style={{ fontSize: 11 }}>
                                {breach.pwn_count.toLocaleString()} affected
                              </span>
                            )}
                          </div>
                        </div>

                        {breach.description && (
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
                            {breach.description.slice(0, 300)}{breach.description.length > 300 ? "..." : ""}
                          </p>
                        )}

                        {breach.data_classes?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {breach.data_classes.map((dc) => (
                              <span
                                key={dc}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: (DATA_CLASS_COLORS[dc] || "#0066FF") + "20",
                                  color: DATA_CLASS_COLORS[dc] || "#0066FF",
                                  border: `1px solid ${(DATA_CLASS_COLORS[dc] || "#0066FF")}40`,
                                }}
                              >
                                {dc}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </>
      )}
    </ToolPage>
  );
}
