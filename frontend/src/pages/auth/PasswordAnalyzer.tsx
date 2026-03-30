import { useState, useCallback } from "react";
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AnalyzePassword } from "../../../wailsjs/go/main/App";
import type { auth } from "../../../wailsjs/go/models";

const STRENGTH_COLORS: Record<string, string> = {
  very_weak: "#FF3344",
  weak: "#FF6633",
  fair: "#FFB800",
  strong: "#00CC66",
  very_strong: "#00FF88",
};

const STRENGTH_LABELS: Record<string, string> = {
  very_weak: "Very Weak",
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  very_strong: "Very Strong",
};

const STRENGTH_WIDTHS: Record<string, string> = {
  very_weak: "10%",
  weak: "30%",
  fair: "55%",
  strong: "75%",
  very_strong: "100%",
};

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<auth.PasswordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async (pw: string) => {
    if (!pw) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const r = await AnalyzePassword(pw);
      setResult(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    analyze(v);
  };

  const color = result?.strength ? STRENGTH_COLORS[result.strength] ?? "#666" : "#333";
  const label = result?.strength ? STRENGTH_LABELS[result.strength] ?? result.strength : "";
  const width = result?.strength ? STRENGTH_WIDTHS[result.strength] ?? "0%" : "0%";

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Password Analyzer</h1>
        <p className="text-secondary">Entropy, breach check &amp; strength analysis</p>
      </div>

      {/* Input */}
      <div style={{ position: "relative", marginTop: 24 }}>
        <input
          type={show ? "text" : "password"}
          value={password}
          onChange={handleChange}
          placeholder="Enter password to analyze..."
          className="tool-input"
          style={{ paddingRight: 48, fontFamily: "monospace", fontSize: 16 }}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          onClick={() => setShow((s) => !s)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 4,
          }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Strength bar */}
      {password && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="text-secondary" style={{ fontSize: 13 }}>Password Strength</span>
            {loading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color }}>
                {label}
              </span>
            )}
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width,
                background: color,
                borderRadius: 3,
                transition: "width 0.4s ease, background 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Score & crack time */}
          <div className="result-card" style={{ marginTop: 16, borderColor: color + "40" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 700, color }}>{result.score}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>Score / 100</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--accent)" }}>{result.entropy?.toFixed(1)}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>Bits of Entropy</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{result.crack_time}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>Online Crack Time</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{result.crack_time_offline}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>Offline (GPU)</div>
              </div>
            </div>
          </div>

          {/* HIBP Breach status */}
          <div
            className="result-card"
            style={{ borderColor: result.is_breached ? "#FF334430" : "#00FF8820" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {result.is_breached ? (
                <>
                  <AlertTriangle size={20} style={{ color: "#FF3344", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#FF3344" }}>
                      Found in {result.breach_count?.toLocaleString()} data breaches!
                    </div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      This password has been leaked — never use it.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle size={20} style={{ color: "#00FF88", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#00FF88" }}>Not found in any known breach</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      Checked via HaveIBeenPwned (k-anonymity)
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Character analysis */}
          <div className="result-card">
            <p className="result-card-title">Character Analysis</p>
            <div className="result-grid">
              {[
                ["Length", `${result.length} chars`],
                ["Unique Chars", `${result.unique_chars}`],
                ["Charset Size", `${result.charset_size} symbols`],
              ].map(([label, value]) => (
                <div key={label} className="result-row">
                  <span className="result-label">{label}</span>
                  <span className="result-value">{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {[
                { label: "Uppercase", has: result.has_upper },
                { label: "Lowercase", has: result.has_lower },
                { label: "Digits", has: result.has_digit },
                { label: "Symbols", has: result.has_symbol },
                { label: "Spaces", has: result.has_space },
              ].map(({ label, has }) => (
                <span
                  key={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 4,
                    fontSize: 12,
                    background: has ? "#00FF8815" : "var(--bg-hover)",
                    border: `1px solid ${has ? "#00FF8840" : "var(--border)"}`,
                    color: has ? "#00FF88" : "var(--text-muted)",
                  }}
                >
                  {has ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Patterns detected */}
          {result.patterns && result.patterns.length > 0 && (
            <div className="result-card" style={{ borderColor: "#FFB80030" }}>
              <p className="result-card-title" style={{ color: "#FFB800" }}>Patterns Detected</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.patterns.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={13} style={{ color: "#FFB800", flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="result-card">
              <p className="result-card-title">Recommendations</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Shield size={13} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!password && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Shield size={40} className="text-muted" />
          <p className="text-muted">Type a password above to analyze its strength</p>
        </div>
      )}
    </div>
  );
}
