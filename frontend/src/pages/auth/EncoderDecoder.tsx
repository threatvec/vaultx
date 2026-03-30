import { useState, useCallback } from "react";
import { ArrowLeftRight, Code2, Copy, Check } from "lucide-react";
import { ProcessEncoder, EncodeAll } from "../../../wailsjs/go/main/App";

const FORMATS = [
  { value: "base64", label: "Base64" },
  { value: "url", label: "URL Encode" },
  { value: "html", label: "HTML Entities" },
  { value: "hex", label: "Hexadecimal" },
  { value: "binary", label: "Binary" },
  { value: "rot13", label: "ROT13" },
  { value: "caesar", label: "Caesar Cipher" },
  { value: "morse", label: "Morse Code" },
];

export default function EncoderDecoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState("base64");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [caesarShift, setCaesarShift] = useState(13);
  const [allFormats, setAllFormats] = useState<Record<string, string> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const process = useCallback(async (text: string, fmt: string, md: string, shift: number) => {
    if (!text) {
      setOutput("");
      setError("");
      return;
    }
    try {
      const r = await ProcessEncoder(text, fmt, md, shift);
      if (r.error) {
        setError(r.error);
        setOutput("");
      } else {
        setOutput(r.output ?? "");
        setError("");
      }
    } catch {
      setError("Processing failed");
    }
  }, []);

  const handleInputChange = (v: string) => {
    setInput(v);
    setAllFormats(null);
    process(v, format, mode, caesarShift);
  };

  const handleFormatChange = (fmt: string) => {
    setFormat(fmt);
    setAllFormats(null);
    process(input, fmt, mode, caesarShift);
  };

  const handleModeChange = (md: "encode" | "decode") => {
    setMode(md);
    setAllFormats(null);
    process(input, format, md, caesarShift);
  };

  const handleCaesarChange = (shift: number) => {
    setCaesarShift(shift);
    if (format === "caesar") {
      process(input, "caesar", mode, shift);
    }
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput(input);
    process(output, format, mode, caesarShift);
  };

  const handleEncodeAll = async () => {
    if (!input) return;
    try {
      const r = await EncodeAll(input);
      setAllFormats(r);
    } catch {
      // silent
    }
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Encoder / Decoder</h1>
        <p className="text-secondary">Base64 · URL · HTML · Hex · Binary · ROT13 · Caesar · Morse</p>
      </div>

      <div style={{ marginTop: 24 }}>
        {/* Format selector */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFormatChange(f.value)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: `1px solid ${format === f.value ? "var(--accent)" : "var(--border)"}`,
                background: format === f.value ? "var(--accent)15" : "var(--bg-hover)",
                color: format === f.value ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Caesar shift (only when caesar selected) */}
        {format === "caesar" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, minWidth: 80 }}>Shift: {caesarShift}</span>
            <input
              type="range"
              min={1}
              max={25}
              value={caesarShift}
              onChange={(e) => handleCaesarChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent)" }}
            />
          </div>
        )}

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                padding: "6px 18px",
                borderRadius: 6,
                border: `1px solid ${mode === m ? "var(--accent)" : "var(--border)"}`,
                background: mode === m ? "var(--accent)20" : "transparent",
                color: mode === m ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {m}
            </button>
          ))}
          <button
            onClick={handleEncodeAll}
            disabled={!input}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--bg-hover)",
              color: "var(--text-muted)",
              cursor: input ? "pointer" : "not-allowed",
              fontSize: 12,
              opacity: input ? 1 : 0.5,
            }}
          >
            Encode All Formats
          </button>
        </div>

        {/* Main IO area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "start" }}>
          {/* Input */}
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Input</div>
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`Enter text to ${mode}...`}
              style={{
                width: "100%",
                height: 180,
                padding: "10px 12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Swap button */}
          <div style={{ paddingTop: 24 }}>
            <button
              onClick={handleSwap}
              disabled={!output}
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
                cursor: output ? "pointer" : "not-allowed",
                color: output ? "var(--accent)" : "var(--text-muted)",
                opacity: output ? 1 : 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Swap input and output"
            >
              <ArrowLeftRight size={16} />
            </button>
          </div>

          {/* Output */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Output</span>
              {output && (
                <button
                  onClick={() => copy("main", output)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: copiedKey === "main" ? "#00FF88" : "var(--text-muted)",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  {copiedKey === "main" ? <Check size={12} /> : <Copy size={12} />}
                  {copiedKey === "main" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <textarea
              value={error ? `Error: ${error}` : output}
              readOnly
              style={{
                width: "100%",
                height: 180,
                padding: "10px 12px",
                background: "var(--bg-card)",
                border: `1px solid ${error ? "#FF334430" : "var(--border)"}`,
                borderRadius: 8,
                color: error ? "#FF3344" : "var(--text)",
                fontSize: 13,
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* All formats table */}
        {allFormats && (
          <div className="result-card" style={{ marginTop: 16 }}>
            <p className="result-card-title">All Format Encodings</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(allFormats).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 10px",
                    background: "var(--bg-hover)",
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      minWidth: 80,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--accent)",
                      textTransform: "uppercase",
                      flexShrink: 0,
                      paddingTop: 1,
                    }}
                  >
                    {key}
                  </span>
                  <code
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                      color: "var(--text)",
                    }}
                  >
                    {value}
                  </code>
                  <button
                    onClick={() => copy(key, value)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: copiedKey === key ? "#00FF88" : "var(--text-muted)",
                      flexShrink: 0,
                      padding: "2px 4px",
                    }}
                  >
                    {copiedKey === key ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!input && !allFormats && (
          <div className="tool-empty" style={{ marginTop: 32 }}>
            <Code2 size={40} className="text-muted" />
            <p className="text-muted">Enter text to encode or decode</p>
          </div>
        )}
      </div>
    </div>
  );
}
