import { useState, useEffect, useRef } from "react";
import { Key, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { GenerateTOTPSecret, GetTOTPCode, ValidateTOTPCode } from "../../../wailsjs/go/main/App";
import type { auth } from "../../../wailsjs/go/models";

export default function TOTPGenerator() {
  const [secret, setSecret] = useState("");
  const [accountName, setAccountName] = useState("");
  const [issuer, setIssuer] = useState("VaultX");
  const [totpSecret, setTotpSecret] = useState<auth.TOTPSecret | null>(null);
  const [code, setCode] = useState<auth.TOTPCode | null>(null);
  const [validateInput, setValidateInput] = useState("");
  const [validResult, setValidResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"generate" | "use">("generate");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-refresh code every second when a secret is active
  useEffect(() => {
    const activeSecret = totpSecret?.secret || secret;
    if (!activeSecret) return;

    const refresh = async () => {
      try {
        const c = await GetTOTPCode(activeSecret);
        setCode(c);
      } catch {
        // silent
      }
    };

    refresh();
    timerRef.current = setInterval(refresh, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totpSecret?.secret, secret]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const s = await GenerateTOTPSecret(accountName || "user@vaultx", issuer || "VaultX");
      setTotpSecret(s);
      setSecret(s.secret ?? "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    const activeSecret = totpSecret?.secret || secret;
    if (!activeSecret || !validateInput) return;
    try {
      const valid = await ValidateTOTPCode(activeSecret, validateInput);
      setValidResult(valid);
      setTimeout(() => setValidResult(null), 3000);
    } catch {
      setValidResult(false);
    }
  };

  const remaining = code?.remaining ?? 30;
  const progressPct = (remaining / 30) * 100;
  const progressColor = remaining <= 5 ? "#FF3344" : remaining <= 10 ? "#FFB800" : "var(--accent)";

  // Format code with space: 123 456
  const formattedCode = code?.code
    ? `${code.code.slice(0, 3)} ${code.code.slice(3)}`
    : "--- ---";

  const TabBtn = ({ id, label }: { id: "generate" | "use"; label: string }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "8px 20px",
        borderRadius: 6,
        border: `1px solid ${tab === id ? "var(--accent)" : "var(--border)"}`,
        background: tab === id ? "var(--accent)15" : "transparent",
        color: tab === id ? "var(--accent)" : "var(--text-muted)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>TOTP Generator</h1>
        <p className="text-secondary">RFC 6238 time-based one-time passwords — offline, Google Authenticator compatible</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <TabBtn id="generate" label="Generate New Secret" />
        <TabBtn id="use" label="Use Existing Secret" />
      </div>

      {tab === "generate" && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="text-secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="user@example.com"
                className="tool-input"
              />
            </div>
            <div>
              <label className="text-secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                Issuer / App Name
              </label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="VaultX"
                className="tool-input"
              />
            </div>
          </div>
          <button
            className="tool-scan-btn"
            onClick={handleGenerate}
            disabled={loading}
            style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <Key size={15} /> Generate TOTP Secret
              </>
            )}
          </button>

          {totpSecret && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12 }} className="result-grid">
                <div className="result-row">
                  <span className="result-label">Secret Key</span>
                  <code
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "var(--accent)",
                      letterSpacing: "1px",
                      wordBreak: "break-all",
                    }}
                  >
                    {totpSecret.secret}
                  </code>
                </div>
                <div className="result-row">
                  <span className="result-label">Account</span>
                  <span className="result-value">{totpSecret.account_name}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Issuer</span>
                  <span className="result-value">{totpSecret.issuer}</span>
                </div>
              </div>

              {/* QR Code */}
              {totpSecret.qr_code_b64 && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <p className="text-secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                    Scan with Google Authenticator or Authy
                  </p>
                  <img
                    src={`data:image/png;base64,${totpSecret.qr_code_b64}`}
                    alt="TOTP QR Code"
                    style={{
                      width: 200,
                      height: 200,
                      border: "2px solid var(--border)",
                      borderRadius: 8,
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "use" && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <label className="text-secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            TOTP Secret Key (Base32)
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value.trim().toUpperCase())}
            placeholder="JBSWY3DPEHPK3PXP"
            className="tool-input"
            style={{ fontFamily: "monospace", letterSpacing: "1px" }}
            spellCheck={false}
          />
        </div>
      )}

      {/* Live TOTP code display */}
      {(totpSecret || secret) && code && (
        <div className="result-card" style={{ marginTop: 16, textAlign: "center" }}>
          <p className="result-card-title">Current Code</p>

          {/* Big code */}
          <div
            style={{
              fontSize: 48,
              fontFamily: "monospace",
              fontWeight: 700,
              color: progressColor,
              letterSpacing: 8,
              margin: "16px 0",
              transition: "color 0.3s",
            }}
          >
            {formattedCode}
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 6, background: "var(--bg-hover)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: progressColor,
                borderRadius: 3,
                transition: "width 1s linear, background 0.3s",
              }}
            />
          </div>
          <p className="text-secondary" style={{ fontSize: 13 }}>
            Refreshes in <strong style={{ color: progressColor }}>{remaining}s</strong>
          </p>

          {/* Validate */}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit code to validate"
              className="tool-input"
              style={{ flex: 1, fontFamily: "monospace", letterSpacing: "2px" }}
              maxLength={6}
            />
            <button className="tool-action-btn" onClick={handleValidate} style={{ flexShrink: 0 }}>
              Validate
            </button>
          </div>

          {validResult !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 10,
                color: validResult ? "#00FF88" : "#FF3344",
              }}
            >
              {validResult ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span style={{ fontWeight: 600 }}>{validResult ? "Code is valid!" : "Invalid code"}</span>
            </div>
          )}
        </div>
      )}

      {!totpSecret && !secret && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <RefreshCw size={40} className="text-muted" />
          <p className="text-muted">Generate a new secret or enter an existing one</p>
        </div>
      )}
    </div>
  );
}
