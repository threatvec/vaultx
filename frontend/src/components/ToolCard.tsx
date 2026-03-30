import { motion } from "framer-motion";
import { ChevronRight, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DifficultyKey, AudienceKey } from "../data/guideTools";

export interface ToolGuideCard {
  id: string;
  name: string;
  icon: string;
  category: string;
  tagline: string;
  description: string;
  difficulty: DifficultyKey;
  audience: AudienceKey[];
  useCases: string[];
  steps: string[];
  requiredAPI: { name: string; url: string; free: boolean }[];
  faq: { q: string; a: string }[];
  tips: string[];
  relatedTools: string[];
}

interface ToolCardProps {
  tool: ToolGuideCard;
  index: number;
  onDetails: () => void;
  onOpen: () => void;
}

export const DIFFICULTY_COLORS: Record<DifficultyKey, { bg: string; color: string }> = {
  beginner:     { bg: "#00FF8815", color: "#00FF88" },
  intermediate: { bg: "#FFB80015", color: "#FFB800" },
  advanced:     { bg: "#FF444415", color: "#FF4444" },
};

export const AUDIENCE_ICON: Record<AudienceKey, string> = {
  everyone:   "👤",
  security:   "🛡️",
  pentest:    "🎯",
  sysadmin:   "⚙️",
  journalist: "📰",
  researcher: "🔍",
  developer:  "💻",
  webdev:     "🌐",
  team:       "👥",
};

export default function ToolCard({ tool, index, onDetails, onOpen }: ToolCardProps) {
  const { t } = useTranslation();
  const diff = DIFFICULTY_COLORS[tool.difficulty];

  return (
    <motion.div
      className="result-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{tool.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{tool.name}</div>
            <div
              style={{
                fontSize: 10,
                marginTop: 3,
                padding: "1px 7px",
                borderRadius: 4,
                background: "var(--accent)15",
                color: "var(--accent)",
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              {t(`sidebar.${tool.category}`)}
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 4,
            background: diff.bg,
            color: diff.color,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {t(`guide.difficulty.${tool.difficulty}`)}
        </span>
      </div>

      {/* Audience */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tool.audience.map((a) => (
          <span
            key={a}
            title={t(`guide.audience.${a}`)}
            style={{
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: 12,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{AUDIENCE_ICON[a] || "👤"}</span>
            <span>{t(`guide.audience.${a}`)}</span>
          </span>
        ))}
      </div>

      {/* Tagline */}
      <p
        className="text-secondary"
        style={{ fontSize: 12, lineHeight: 1.5, margin: 0, flexGrow: 1 }}
      >
        {tool.tagline}
      </p>

      {/* API badges */}
      {tool.requiredAPI.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tool.requiredAPI.map((api) => (
            <span
              key={api.name}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 4,
                background: api.free ? "#00FF8810" : "#FFB80010",
                color: api.free ? "#00FF88" : "#FFB800",
                border: `1px solid ${api.free ? "#00FF8830" : "#FFB80030"}`,
              }}
            >
              🔑 {api.name} {api.free ? `(${t("guide.free")})` : `(${t("guide.paid")})`}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        <button
          onClick={onDetails}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--bg-hover)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Info size={13} />
          {t("guide.details")}
        </button>
        <button
          onClick={onOpen}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 6,
            border: "1px solid var(--accent)40",
            background: "var(--accent)15",
            color: "var(--accent)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          {t("guide.openTool")}
          <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
