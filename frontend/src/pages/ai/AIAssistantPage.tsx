import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Loader2, Trash2, Sparkles, Copy, Check } from "lucide-react";
import { QueryAI, GetAIProvider, SaveAIMessage, GetAIHistory } from "../../../wailsjs/go/main/App";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("detecting...");
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    GetAIProvider().then(setProvider).catch(() => setProvider("none"));
    GetAIHistory(50)
      .then((history) => {
        if (history && history.length > 0) {
          const msgs: Message[] = history.map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content,
            timestamp: h.timestamp,
          }));
          setMessages(msgs);
        }
      })
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      SaveAIMessage("user", userMsg.content).catch(() => {});
      const response = await QueryAI(userMsg.content);
      const assistantMsg: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      SaveAIMessage("assistant", response).catch(() => {});
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err?.message || "AI query failed. Check Settings for API keys or Ollama status."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const providerColor =
    provider === "ollama"
      ? "#00FF88"
      : provider === "openai"
      ? "#10A37F"
      : provider === "anthropic"
      ? "#D4A574"
      : provider === "gemini"
      ? "#4285F4"
      : "var(--text-muted)";

  const quickPrompts = [
    "What are the most common web application vulnerabilities?",
    "How do I check if my server is properly hardened?",
    "Explain SPF, DKIM, and DMARC email authentication",
    "What should I do if my email was found in a data breach?",
  ];

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 40px)" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>AI Security Assistant</h1>
            <p className="text-secondary">Ask anything about cybersecurity — powered by AI</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: providerColor + "15",
                border: `1px solid ${providerColor}40`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: providerColor }} />
              <span style={{ fontSize: 12, color: providerColor, fontWeight: 600, textTransform: "uppercase" }}>
                {provider}
              </span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 0,
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <Bot size={48} style={{ color: "var(--text-muted)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>How can I help?</p>
              <p className="text-secondary" style={{ fontSize: 13 }}>
                Ask about security, threats, or analyze scan results
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 600 }}>
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setInput(qp)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                    maxWidth: 280,
                    transition: "border-color 0.2s",
                  }}
                  onMouseOver={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onMouseOut={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}
                >
                  <Sparkles size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "middle", color: "var(--accent)" }} />
                  {qp}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: msg.role === "user" ? "var(--accent)20" : "var(--bg-card)",
                border: `1px solid ${msg.role === "user" ? "var(--accent)40" : "var(--border)"}`,
                position: "relative",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Bot size={13} style={{ color: providerColor }} />
                  <span style={{ fontSize: 10, color: providerColor, fontWeight: 600, textTransform: "uppercase" }}>
                    {provider}
                  </span>
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--text)",
                }}
              >
                {msg.content}
              </div>
              {msg.role === "assistant" && (
                <button
                  onClick={() => copyMessage(i, msg.content)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: copied === i ? "#00FF88" : "var(--text-muted)",
                    padding: 2,
                    opacity: 0.6,
                  }}
                >
                  {copied === i ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "12px 12px 12px 2px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Loader2 size={14} className="animate-spin" style={{ color: providerColor }} />
              <span className="text-secondary" style={{ fontSize: 13 }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a security question... (Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 14,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              minHeight: 42,
              maxHeight: 120,
              boxSizing: "border-box",
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: input.trim() ? "var(--accent)" : "var(--bg-hover)",
              color: input.trim() ? "#000" : "var(--text-muted)",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 13,
              height: 42,
              transition: "all 0.2s",
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
