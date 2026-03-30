import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe, Shield, Network, FileSearch, User, Lock, Bot, Search,
} from "lucide-react";
import ToolCard, { type ToolGuideCard } from "../components/ToolCard";
import ToolDetailModal from "../components/ToolDetailModal";
import { TOOL_BASE, type DifficultyKey, type AudienceKey } from "../data/guideTools";
import contentEn from "../data/guideDataEn";
import contentTr from "../data/guideDataTr";

/* ─── Categories ─────────────────────────────────────────────────── */
const CATEGORY_ICONS = {
  all:              Search,
  domainWeb:        Globe,
  cyberThreat:      Shield,
  networkIp:        Network,
  fileAnalysis:     FileSearch,
  identityOsint:    User,
  passwordSecurity: Lock,
  aiTools:          Bot,
};

const DIFFICULTY_OPTIONS: ("all" | DifficultyKey)[] = ["all", "beginner", "intermediate", "advanced"];
const AUDIENCE_OPTIONS: ("all" | AudienceKey)[] = [
  "all", "everyone", "security", "pentest", "sysadmin", "journalist", "researcher", "developer",
];

/* ─── Props ──────────────────────────────────────────────────────── */
interface GuideProps {
  onNavigate: (page: string) => void;
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function Guide({ onNavigate }: GuideProps) {
  const { t, i18n } = useTranslation();
  const [category, setCategory]         = useState("all");
  const [search, setSearch]             = useState("");
  const [difficulty, setDifficulty]     = useState<"all" | DifficultyKey>("all");
  const [audience, setAudience]         = useState<"all" | AudienceKey>("all");
  const [selectedTool, setSelectedTool] = useState<ToolGuideCard | null>(null);

  /* Build the full TOOLS array by merging base data + language-specific content */
  const TOOLS: ToolGuideCard[] = useMemo(() => {
    const content = i18n.language === "tr" ? contentTr : contentEn;
    return TOOL_BASE.map((base) => {
      const c = content[base.id];
      return {
        ...base,
        tagline:     c?.tagline     ?? "",
        description: c?.description ?? "",
        useCases:    c?.useCases    ?? [],
        steps:       c?.steps       ?? [],
        faq:         c?.faq         ?? [],
        tips:        c?.tips        ?? [],
      } as ToolGuideCard;
    });
  }, [i18n.language]);

  const CATEGORIES = Object.entries(CATEGORY_ICONS).map(([key, Icon]) => ({
    key,
    label: key === "all" ? t("guide.allCategories") : t(`sidebar.${key}`),
    icon: Icon,
  }));

  const DIFFICULTY_COLORS: Record<string, string> = {
    all:          "var(--accent)",
    beginner:     "#00FF88",
    intermediate: "#FFB800",
    advanced:     "#FF4444",
  };

  const filtered = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchCat  = category   === "all" || tool.category   === category;
      const matchDiff = difficulty === "all" || tool.difficulty === difficulty;
      const matchAud  = audience   === "all" || tool.audience.includes(audience as AudienceKey);
      const q         = search.toLowerCase();
      const matchSrch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.audience.some((a) => t(`guide.audience.${a}`).toLowerCase().includes(q));
      return matchCat && matchDiff && matchAud && matchSrch;
    });
  }, [TOOLS, category, difficulty, audience, search, t]);

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <h1>{t("guide.title")}</h1>
        <p className="text-secondary">
          {TOOLS.length} {i18n.language === "tr" ? "araç, 7 kategori — tüm araçları nasıl kullanacağını öğren" : "tools, 7 categories — learn how to use every tool"}
        </p>
      </div>

      {/* Search + difficulty filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("guide.searchPlaceholder")}
            className="tool-input"
            style={{ paddingLeft: 32 }}
          />
        </div>

        {/* Difficulty filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {DIFFICULTY_OPTIONS.map((d) => {
            const active = difficulty === d;
            const color = DIFFICULTY_COLORS[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 6,
                  border: `1px solid ${active ? color : "var(--border)"}`,
                  background: active ? `${color}18` : "var(--bg-hover)",
                  color: active ? color : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {d === "all" ? t("guide.allDifficulties") : t(`guide.difficulty.${d}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audience quick filter */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
        {AUDIENCE_OPTIONS.map((a) => (
          <button
            key={a}
            onClick={() => setAudience(a)}
            style={{
              padding: "4px 10px",
              borderRadius: 12,
              border: `1px solid ${audience === a ? "var(--accent)" : "var(--border)"}`,
              background: audience === a ? "var(--accent)15" : "transparent",
              color: audience === a ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: audience === a ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {a === "all" ? t("guide.allAudiences") : t(`guide.audience.${a}`)}
          </button>
        ))}
      </div>

      {/* Content area: left category sidebar + grid */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "flex-start" }}>
        {/* Category sidebar */}
        <div
          style={{
            flexShrink: 0,
            width: 180,
            position: "sticky",
            top: 16,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "0 8px 8px",
            }}
          >
            {t("guide.categoriesLabel")}
          </div>
          {CATEGORIES.map((cat) => {
            const count =
              cat.key === "all"
                ? TOOLS.length
                : TOOLS.filter((tool) => tool.category === cat.key).length;
            const active = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${active ? "var(--accent)40" : "transparent"}`,
                  background: active ? "var(--accent)12" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <cat.icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{cat.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: active ? "var(--accent)25" : "var(--bg-hover)",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tools grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Result count */}
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <strong style={{ color: "var(--accent)" }}>{filtered.length}</strong>
            <span>{i18n.language === "tr" ? "araç gösteriliyor" : "tools shown"}</span>
            {filtered.length !== TOOLS.length && (
              <span style={{ color: "var(--text-muted)" }}>
                {i18n.language === "tr"
                  ? `(toplam ${TOOLS.length}'den filtrelendi)`
                  : `(filtered from ${TOOLS.length})`}
              </span>
            )}
          </div>

          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 10,
              }}
            >
              {filtered.map((tool, i) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={i}
                  onDetails={() => setSelectedTool(tool)}
                  onOpen={() => onNavigate(tool.id)}
                />
              ))}
            </div>
          ) : (
            <div className="tool-empty" style={{ marginTop: 48 }}>
              <Search size={36} className="text-muted" />
              <p className="text-muted" style={{ marginTop: 12 }}>
                {t("guide.noToolsFound")}
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setDifficulty("all");
                  setAudience("all");
                }}
                style={{
                  marginTop: 12,
                  padding: "7px 16px",
                  borderRadius: 6,
                  border: "1px solid var(--accent)40",
                  background: "var(--accent)15",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {t("guide.clearFilters")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onOpen={() => { onNavigate(selectedTool.id); setSelectedTool(null); }}
        />
      )}
    </div>
  );
}
