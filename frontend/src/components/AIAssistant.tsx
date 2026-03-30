import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { QueryAI } from "../../wailsjs/go/main/App";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await QueryAI(userMsg.content);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err?.message || t("common.error") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button className="ai-fab" onClick={() => setOpen(!open)} title={t("tools.aiAssistant")}>
        <Bot size={24} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="ai-panel-header">
              <div className="ai-panel-title">
                <Bot size={18} />
                <span>{t("tools.aiAssistant")}</span>
              </div>
              <button className="ai-panel-close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="ai-panel-messages">
              {messages.length === 0 && (
                <div className="ai-panel-empty">
                  <Bot size={32} className="text-muted" />
                  <p>{t("tools.aiAssistant")}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`ai-message ${msg.role}`}>
                  <p>{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="ai-message assistant">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-panel-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("common.search")}
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
