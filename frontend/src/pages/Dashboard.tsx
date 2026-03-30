import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ScanLine,
  Shield,
  Activity,
  Eye,
  BarChart3,
  AlertTriangle,
  Globe,
  Lock,
  Search,
  FileSearch,
  User,
  Bot,
  Award,
} from "lucide-react";
import { GetDashboardStats, GetRecentActivity, GetBadges } from "../../wailsjs/go/main/App";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface StatCard {
  key: string;
  label: string;
  icon: React.ElementType;
  value: number;
  color: string;
}

const QUICK_TOOLS = [
  { key: "shadow-scan", label: "ShadowScan", icon: Globe, color: "#00FF88", desc: "Full attack surface" },
  { key: "url-scanner", label: "URL Scanner", icon: Search, color: "#0066FF", desc: "Check any URL" },
  { key: "email-breach", label: "Email Breach", icon: AlertTriangle, color: "#FF3344", desc: "Check breaches" },
  { key: "ip-intelligence", label: "IP Intel", icon: Activity, color: "#FFB800", desc: "IP lookup" },
  { key: "password-analyzer", label: "Password", icon: Lock, color: "#CC66FF", desc: "Check strength" },
  { key: "username-search", label: "Username", icon: User, color: "#00CCFF", desc: "Search platforms" },
  { key: "hash-lookup", label: "Hash Lookup", icon: FileSearch, color: "#FF6633", desc: "VirusTotal check" },
  { key: "ai-assistant", label: "AI Assistant", icon: Bot, color: "#00FF88", desc: "Ask security Q's" },
];

interface RecentItem {
  tool: string;
  query: string;
  timestamp: string;
}

interface BadgeItem {
  Name: string;
  Description: string;
  Icon: string;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsDetected: 0,
    securityScore: 0,
    activeMonitors: 0,
    badgeCount: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);

  useEffect(() => {
    GetDashboardStats()
      .then((s: any) => {
        setStats({
          totalScans: s.totalScans || 0,
          threatsDetected: s.threatsDetected || 0,
          securityScore: s.securityScore || 0,
          activeMonitors: s.activeMonitors || 0,
          badgeCount: s.badgeCount || 0,
        });
      })
      .catch(() => {});

    GetRecentActivity(10)
      .then((items: any) => {
        if (items) setRecent(items as RecentItem[]);
      })
      .catch(() => {});

    GetBadges()
      .then((b: BadgeItem[]) => {
        if (b) setBadges(b);
      })
      .catch(() => {});
  }, []);

  const statCards: StatCard[] = [
    { key: "totalScans", label: t("dashboard.totalScans"), icon: BarChart3, value: stats.totalScans, color: "var(--accent)" },
    { key: "threatsDetected", label: t("dashboard.threatsDetected"), icon: AlertTriangle, value: stats.threatsDetected, color: "#FF3344" },
    { key: "securityScore", label: t("dashboard.securityScore"), icon: Shield, value: stats.securityScore, color: "#00FF88" },
    { key: "activeMonitors", label: t("dashboard.activeMonitors"), icon: Eye, value: stats.activeMonitors, color: "#0066FF" },
  ];

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>{t("dashboard.welcome")}</h1>
        <p className="text-secondary">{t("app.slogan")}</p>
      </motion.div>

      {/* Stats grid */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <div className="stat-card-icon" style={{ color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Quick actions + tools */}
        <motion.div
          className="dashboard-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2>{t("dashboard.quickActions")}</h2>

          <button className="scan-me-btn" onClick={() => onNavigate("scan-me")} style={{ marginBottom: 12 }}>
            <ScanLine size={28} />
            <div>
              <span className="scan-me-title">{t("dashboard.scanMe")}</span>
              <span className="scan-me-desc">{t("dashboard.scanMeDesc")}</span>
            </div>
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {QUICK_TOOLS.map((tool, i) => (
              <motion.button
                key={tool.key}
                onClick={() => onNavigate(tool.key)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "14px 8px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--bg-base)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                whileHover={{ y: -2, borderColor: tool.color + "55", background: tool.color + "08" } as any}
              >
                <tool.icon size={20} style={{ color: tool.color }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{tool.label}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{tool.desc}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Right column: Recent + Badges */}
        <div>
          {/* Recent activity */}
          <motion.div
            className="dashboard-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <h2>{t("dashboard.recentActivity")}</h2>
            <div className="activity-list">
              {recent.length === 0 ? (
                <div className="activity-empty">
                  <Activity size={24} className="text-muted" />
                  <p className="text-muted">{t("common.noResults")}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {recent.slice(0, 8).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 7,
                        background: "var(--bg-hover)",
                        fontSize: 12,
                        minHeight: 40,
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(var(--accent-rgb), 0.12)",
                          color: "var(--accent)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          flexShrink: 0,
                          letterSpacing: "0.3px",
                        }}
                      >
                        {item.tool}
                      </span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                        {item.query}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                        {item.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Badges */}
          {badges.length > 0 && (
            <motion.div
              className="dashboard-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              style={{ marginTop: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Award size={18} style={{ color: "var(--accent)" }} />
                <h2 style={{ margin: 0 }}>Badges ({badges.length})</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {badges.map((badge, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                    title={badge.Description}
                  >
                    <span style={{ fontSize: 16 }}>{badge.Icon}</span>
                    <span style={{ fontWeight: 500 }}>{badge.Name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
