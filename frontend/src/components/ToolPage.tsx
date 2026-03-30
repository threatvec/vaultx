import { useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { History, Download, Copy, Bot, Search, Loader2 } from "lucide-react";
import { GetQueryHistory } from "../../wailsjs/go/main/App";

export interface ToolPageProps {
  title: string;
  description?: string;
  placeholder: string;
  onQuery: (input: string) => Promise<void>;
  loading: boolean;
  toolName: string;
  children?: ReactNode;
  hasResult?: boolean;
  onExport?: () => void;
  onAIAnalyze?: () => void;
  onCopy?: () => void;
}

interface HistoryEntry {
  id: number;
  tool: string;
  query: string;
  result: string;
  created_at: string;
}

export default function ToolPage({
  title,
  description,
  placeholder,
  onQuery,
  loading,
  toolName,
  children,
  hasResult,
  onExport,
  onAIAnalyze,
  onCopy,
}: ToolPageProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [queried, setQueried] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [toolName]);

  const loadHistory = async () => {
    try {
      const h = await GetQueryHistory(toolName, 10);
      setHistory((h as any) || []);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setQueried(true);
    await onQuery(input.trim());
    loadHistory();
  };

  const handleHistoryClick = (query: string) => {
    setInput(query);
    setShowHistory(false);
    onQuery(query);
  };

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>{title}</h1>
        {description && <p className="text-secondary">{description}</p>}
      </motion.div>

      <motion.div
        className="tool-input-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <form className="tool-input-form" onSubmit={handleSubmit}>
          <div className="tool-input-wrapper">
            <Search size={18} className="tool-input-icon" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              className="tool-input"
            />
            {history.length > 0 && (
              <button
                type="button"
                className="tool-history-btn"
                onClick={() => setShowHistory(!showHistory)}
                title="History"
              >
                <History size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="tool-scan-btn" disabled={loading || !input.trim()}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span>{loading ? t("common.loading") : t("common.submit")}</span>
          </button>
        </form>

        {showHistory && history.length > 0 && (
          <motion.div
            className="tool-history-dropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="tool-history-label">{t("commandPalette.recentQueries")}</p>
            {history.map((h) => (
              <button
                key={h.id}
                className="tool-history-item"
                onClick={() => handleHistoryClick(h.query)}
              >
                <History size={13} />
                <span>{h.query}</span>
                <span className="tool-history-time">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {loading && (
        <div className="tool-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {!loading && hasResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {(onExport || onCopy || onAIAnalyze) && (
            <div className="tool-actions">
              {onCopy && (
                <button className="tool-action-btn" onClick={onCopy}>
                  <Copy size={14} />
                  <span>{t("common.copy")}</span>
                </button>
              )}
              {onExport && (
                <button className="tool-action-btn" onClick={onExport}>
                  <Download size={14} />
                  <span>{t("common.export")}</span>
                </button>
              )}
              {onAIAnalyze && (
                <button className="tool-action-btn accent" onClick={onAIAnalyze}>
                  <Bot size={14} />
                  <span>Analyze with AI</span>
                </button>
              )}
            </div>
          )}
          {children}
        </motion.div>
      )}

      {!loading && queried && !hasResult && (
        <div className="tool-empty">
          <Search size={40} className="text-muted" />
          <p className="text-muted">{t("common.noResults")}</p>
        </div>
      )}
    </div>
  );
}
