import { useState, useCallback } from "react";
import { RefreshCw, Copy, Check, Zap } from "lucide-react";
import { GeneratePasswords } from "../../../wailsjs/go/main/App";
import type { auth } from "../../../wailsjs/go/models";

const STRENGTH_COLORS: Record<string, string> = {
  very_weak: "#FF3344",
  weak: "#FF6633",
  fair: "#FFB800",
  strong: "#00CC66",
  very_strong: "#00FF88",
};

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [useSpace, setUseSpace] = useState(false);
  const [memorable, setMemorable] = useState(false);
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<auth.GeneratedPassword[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const r = await GeneratePasswords({
        length,
        use_lower: useLower,
        use_upper: useUpper,
        use_digits: useDigits,
        use_symbols: useSymbols,
        use_space: useSpace,
        memorable,
        count,
      });
      setResults(r || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [length, useLower, useUpper, useDigits, useSymbols, useSpace, memorable, count]);

  const copyPw = (idx: number, pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const ToggleBtn = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: "6px 14px",
        borderRadius: 6,
        border: `1px solid ${value ? "var(--accent)" : "var(--border)"}`,
        background: value ? "var(--accent)15" : "var(--bg-hover)",
        color: value ? "var(--accent)" : "var(--text-muted)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Password Generator</h1>
        <p className="text-secondary">Cryptographically secure password generation</p>
      </div>

      <div className="result-card" style={{ marginTop: 24 }}>
        {/* Length slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Length</span>
            <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>
              {length}
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="text-muted" style={{ fontSize: 11 }}>8</span>
            <span className="text-muted" style={{ fontSize: 11 }}>64</span>
          </div>
        </div>

        {/* Character class toggles */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Character Classes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <ToggleBtn label="Lowercase (a-z)" value={useLower} onChange={setUseLower} />
            <ToggleBtn label="Uppercase (A-Z)" value={useUpper} onChange={setUseUpper} />
            <ToggleBtn label="Digits (0-9)" value={useDigits} onChange={setUseDigits} />
            <ToggleBtn label="Symbols (!@#)" value={useSymbols} onChange={setUseSymbols} />
            <ToggleBtn label="Spaces" value={useSpace} onChange={setUseSpace} />
          </div>
        </div>

        {/* Memorable toggle */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <ToggleBtn label="Memorable Mode" value={memorable} onChange={setMemorable} />
          {memorable && (
            <span className="text-secondary" style={{ fontSize: 12 }}>
              Word combinations with numbers &amp; symbols
            </span>
          )}
        </div>

        {/* Count */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Count</span>
            <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>
              {count}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="text-muted" style={{ fontSize: 11 }}>1</span>
            <span className="text-muted" style={{ fontSize: 11 }}>50</span>
          </div>
        </div>

        {/* Generate button */}
        <button
          className="tool-scan-btn"
          onClick={generate}
          disabled={loading}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <>
              <Zap size={15} /> Generate {count > 1 ? `${count} Passwords` : "Password"}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((r, i) => {
            const strengthColor = STRENGTH_COLORS[r.strength ?? "fair"] ?? "#888";
            return (
              <div
                key={i}
                className="result-card"
                style={{ borderColor: strengthColor + "30", padding: "12px 16px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <code
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: 15,
                      color: "var(--accent)",
                      wordBreak: "break-all",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {r.password}
                  </code>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600, textTransform: "uppercase" }}>
                        {r.strength?.replace("_", " ")}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        Score: {r.score} · {r.entropy?.toFixed(0)}b
                      </div>
                    </div>
                    <button
                      onClick={() => copyPw(i, r.password ?? "")}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        cursor: "pointer",
                        color: copied === i ? "#00FF88" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                      }}
                    >
                      {copied === i ? <Check size={13} /> : <Copy size={13} />}
                      {copied === i ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Zap size={40} className="text-muted" />
          <p className="text-muted">Configure options and click Generate</p>
        </div>
      )}
    </div>
  );
}
