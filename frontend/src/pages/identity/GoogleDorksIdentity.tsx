import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, Copy, ChevronDown, ChevronRight, CheckCheck } from "lucide-react";
import { GenerateIdentityDorks } from "../../../wailsjs/go/main/App";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import type { identity } from "../../../wailsjs/go/models";

export default function GoogleDorksIdentity() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<identity.DorkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string>("");

  const handleSearch = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const r = await GenerateIdentityDorks(domain.trim());
      setResult(r);
      // Expand first group by default
      if (r.groups?.length) {
        setExpanded({ [r.groups[0].category]: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyQuery = (query: string, key: string) => {
    navigator.clipboard.writeText(query);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const copyAllGroup = (category: string, dorks: identity.DorkEntry[]) => {
    const text = dorks.map((d) => d.query).join("\n");
    navigator.clipboard.writeText(text);
    setCopied("group_" + category);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Google Dorks Generator</h1>
        <p className="text-secondary">Generate 70+ Google dork queries across 12 categories for any domain</p>
      </motion.div>

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          placeholder="example.com"
          className="tool-input"
          style={{ flex: 1 }}
        />
        <button className="tool-scan-btn" onClick={handleSearch} disabled={loading || !domain.trim()}>
          {loading ? "Generating..." : <><Search size={15} /> Generate</>}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
          <div className="result-card" style={{ marginBottom: 16 }}>
            <span className="result-badge info" style={{ fontSize: 14, padding: "6px 14px" }}>
              {result.total} dorks generated for {result.domain}
            </span>
          </div>

          {result.groups?.map((group) => {
            const isOpen = !!expanded[group.category];
            return (
              <div key={group.category} className="result-card" style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
                {/* Group header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => setExpanded((prev) => ({ ...prev, [group.category]: !prev[group.category] }))}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{group.icon}</span>
                    <span style={{ fontWeight: 600 }}>{group.category}</span>
                    <span className="result-badge info" style={{ fontSize: 11 }}>{group.dorks?.length}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className="tool-action-btn"
                      style={{ padding: "3px 8px", fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); copyAllGroup(group.category, group.dorks); }}
                    >
                      {copied === "group_" + group.category ? <CheckCheck size={11} /> : <Copy size={11} />}
                      {copied === "group_" + group.category ? "Copied!" : "Copy All"}
                    </button>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Group dorks */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", borderTop: "1px solid var(--border)" }}
                    >
                      {group.dorks?.map((dork, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 16px",
                            borderBottom: i < group.dorks.length - 1 ? "1px solid var(--border)" : "none",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{dork.title}</div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: "var(--accent)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {dork.query}
                            </div>
                            {dork.description && (
                              <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                                {dork.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                              className="tool-action-btn"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={() => copyQuery(dork.query, dork.title + i)}
                            >
                              {copied === dork.title + i ? <CheckCheck size={11} /> : <Copy size={11} />}
                            </button>
                            <button
                              className="tool-action-btn"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={() => BrowserOpenURL(dork.search_url)}
                            >
                              <ExternalLink size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}

      {!result && !loading && (
        <div className="tool-empty" style={{ marginTop: 40 }}>
          <Search size={40} className="text-muted" />
          <p className="text-muted">Enter a domain to generate Google dork queries</p>
        </div>
      )}
    </div>
  );
}
