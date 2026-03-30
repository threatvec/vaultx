import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ExternalLink, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ToolGuideCard } from "./ToolCard";
import { DIFFICULTY_COLORS, AUDIENCE_ICON } from "./ToolCard";

interface ToolDetailModalProps {
  tool: ToolGuideCard;
  onClose: () => void;
  onOpen: () => void;
}

export default function ToolDetailModal({ tool, onClose, onOpen }: ToolDetailModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("overview");

  const TABS = [
    { key: "overview", label: t("guide.overview") },
    { key: "howto",    label: t("guide.howToUse") },
    { key: "api",      label: t("guide.apiSetup") },
    { key: "faq",      label: t("guide.faq") },
    { key: "tips",     label: t("guide.proTips") },
  ];

  const diff = DIFFICULTY_COLORS[tool.difficulty];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            width: "100%",
            maxWidth: 640,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Modal header */}
          <div
            style={{
              padding: "18px 20px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{tool.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{tool.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 7px",
                      borderRadius: 4,
                      background: "var(--accent)15",
                      color: "var(--accent)",
                      fontWeight: 600,
                    }}
                  >
                    {t(`sidebar.${tool.category}`)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 7px",
                      borderRadius: 4,
                      background: diff.bg,
                      color: diff.color,
                      fontWeight: 700,
                    }}
                  >
                    {t(`guide.difficulty.${tool.difficulty}`)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
              overflowX: "auto",
            }}
          >
            {TABS.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                style={{
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: tab === tb.key ? "2px solid var(--accent)" : "2px solid transparent",
                  color: tab === tb.key ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: tab === tb.key ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Tagline */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "var(--accent)08",
                    borderLeft: "3px solid var(--accent)",
                    fontSize: 13,
                    color: "var(--accent)",
                    fontStyle: "italic",
                  }}
                >
                  "{tool.tagline}"
                </div>

                {/* Description */}
                <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                  {tool.description}
                </p>

                {/* Audience */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {t("guide.targetAudience")}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {tool.audience.map((a) => (
                      <span
                        key={a}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: "var(--bg-hover)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {AUDIENCE_ICON[a] || "👤"} {t(`guide.audience.${a}`)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Use cases */}
                {tool.useCases.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t("guide.useCases")}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {tool.useCases.map((uc, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                          <span className="text-secondary">{uc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related tools */}
                {tool.relatedTools.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t("guide.relatedTools")}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {tool.relatedTools.map((r) => (
                        <span
                          key={r}
                          style={{
                            fontSize: 11,
                            padding: "3px 9px",
                            borderRadius: 4,
                            background: "var(--accent)10",
                            color: "var(--accent)",
                            border: "1px solid var(--accent)25",
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "howto" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("guide.stepByStep")}
                </div>
                {tool.steps.length > 0 ? (
                  tool.steps.map((step, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "var(--accent)20",
                          color: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>
                        {step}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    {t("guide.noStepsMsg")}
                  </p>
                )}
              </div>
            )}

            {tab === "api" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tool.requiredAPI.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: 8,
                      background: "#00FF8810",
                      border: "1px solid #00FF8830",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <CheckCircle size={18} style={{ color: "#00FF88" }} />
                    <span style={{ fontSize: 13, color: "#00FF88" }}>
                      {t("guide.noAPIRequired")}
                    </span>
                  </div>
                ) : (
                  tool.requiredAPI.map((api) => (
                    <div
                      key={api.name}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>🔑 {api.name}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: api.free ? "#00FF8815" : "#FFB80015",
                            color: api.free ? "#00FF88" : "#FFB800",
                            fontWeight: 700,
                          }}
                        >
                          {api.free ? t("guide.free") : t("guide.paid")}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                        {t("guide.apiKeyFor")}
                      </div>
                      <a
                        href={api.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={12} />
                        {api.url}
                      </a>
                      <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                        {t("guide.afterGettingKey")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "faq" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tool.faq.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    {t("guide.noFAQMsg")}
                  </p>
                ) : (
                  tool.faq.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0 }}>{t("guide.faqQ")}</span>
                        <span>{item.q}</span>
                      </div>
                      <div className="text-secondary" style={{ fontSize: 12, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>{t("guide.faqA")}</span>
                        <span>{item.a}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "tips" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tool.tips.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    {t("guide.noTipsMsg")}
                  </p>
                ) : (
                  tool.tips.map((tip, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "var(--accent)08",
                        border: "1px solid var(--accent)20",
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                      <span className="text-secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                        {tip}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => { onOpen(); onClose(); }}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#000",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {t("guide.openTool")}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
