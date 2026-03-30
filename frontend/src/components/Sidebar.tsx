import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  Network,
  FileSearch,
  User,
  Lock,
  Bot,
  Settings,
  LayoutDashboard,
  ScanLine,
  ChevronDown,
  ChevronRight,
  Search,
  Radar,
  Link2,
  FileText,
  Server,
  ShieldCheck,
  Activity,
  Eye,
  AlertTriangle,
  Rss,
  MapPin,
  Wifi,
  Info,
  Route,
  ImageIcon,
  Hash,
  QrCode,
  FileType,
  UserSearch,
  Mail,
  Phone,
  History,
  Code,
  MonitorDot,
  KeyRound,
  Key,
  MailCheck,
  Timer,
  Binary,
  Clipboard,
  MessageSquare,
  BarChart3,
  FileBarChart,
  BookOpen,
  ClipboardList,
  Calendar,
  FolderOpen,
  Share2,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface MenuCategory {
  key: string;
  icon: React.ElementType;
  items: { key: string; page: string; icon: React.ElementType }[];
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["domainWeb"]);

  const categories: MenuCategory[] = [
    {
      key: "domainWeb",
      icon: Globe,
      items: [
        { key: "shadowScan", page: "shadow-scan", icon: Radar },
        { key: "urlScanner", page: "url-scanner", icon: Link2 },
        { key: "whoisLookup", page: "whois-lookup", icon: FileText },
        { key: "dnsAnalyzer", page: "dns-analyzer", icon: Server },
        { key: "sslInspector", page: "ssl-inspector", icon: ShieldCheck },
        { key: "httpHeaders", page: "http-headers", icon: Code },
        { key: "webFingerprint", page: "web-fingerprint", icon: Search },
        { key: "phishingDetector", page: "phishing-detector", icon: AlertTriangle },
      ],
    },
    {
      key: "cyberThreat",
      icon: Shield,
      items: [
        { key: "nightWatch", page: "night-watch", icon: Eye },
        { key: "ipReputation", page: "ip-reputation", icon: ShieldCheck },
        { key: "cveSearch", page: "cve-search", icon: Search },
        { key: "threatFeed", page: "threat-feed", icon: Rss },
      ],
    },
    {
      key: "networkIp",
      icon: Network,
      items: [
        { key: "ipIntelligence", page: "ip-intelligence", icon: Info },
        { key: "ipGeolocation", page: "geo-map", icon: MapPin },
        { key: "portScanner", page: "port-scanner", icon: Wifi },
        { key: "networkTools", page: "network-tools", icon: Route },
        { key: "myIpInfo", page: "my-ip", icon: MonitorDot },
        { key: "bgpLookup", page: "bgp-lookup", icon: Server },
        { key: "topologyMap", page: "network-topology", icon: Share2 },
      ],
    },
    {
      key: "fileAnalysis",
      icon: FileSearch,
      items: [
        { key: "metadataExtractor", page: "metadata-extractor", icon: FileType },
        { key: "imageExif", page: "image-exif", icon: ImageIcon },
        { key: "hashLookup", page: "hash-lookup", icon: Hash },
        { key: "hashGenerator", page: "hash-generator", icon: Hash },
        { key: "qrAnalyzer", page: "qr-analyzer", icon: QrCode },
        { key: "documentAnalyzer", page: "document-analyzer", icon: FileText },
      ],
    },
    {
      key: "identityOsint",
      icon: User,
      items: [
        { key: "usernameSearch", page: "username-search", icon: UserSearch },
        { key: "emailBreach", page: "email-breach", icon: Mail },
        { key: "phoneLookup", page: "phone-lookup", icon: Phone },
        { key: "waybackViewer", page: "wayback-viewer", icon: History },
        { key: "googleDorks", page: "google-dorks-identity", icon: Code },
        { key: "osintDashboard", page: "osint-dashboard", icon: MonitorDot },
      ],
    },
    {
      key: "passwordSecurity",
      icon: Lock,
      items: [
        { key: "passwordAnalyzer", page: "password-analyzer", icon: KeyRound },
        { key: "passwordGenerator", page: "password-generator", icon: Key },
        { key: "emailHeader", page: "email-header", icon: MailCheck },
        { key: "twoFaGenerator", page: "2fa-generator", icon: Timer },
        { key: "encoderDecoder", page: "encoder-decoder", icon: Binary },
        { key: "pasteMonitor", page: "paste-monitor", icon: Clipboard },
      ],
    },
    {
      key: "aiTools",
      icon: Bot,
      items: [
        { key: "aiAssistant", page: "ai-assistant", icon: MessageSquare },
        { key: "aiRiskAnalysis", page: "ai-risk-analysis", icon: BarChart3 },
        { key: "aiReport", page: "ai-report", icon: FileBarChart },
      ],
    },
  ];

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">VAULT</span>
        <span className="logo-accent">X</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("dashboard")}
        >
          <LayoutDashboard size={18} />
          <span>{t("sidebar.dashboard")}</span>
        </button>

        <button
          className={`sidebar-item scan-me ${currentPage === "scan-me" ? "active" : ""}`}
          onClick={() => onNavigate("scan-me")}
        >
          <ScanLine size={18} />
          <span>{t("sidebar.scanMe")}</span>
        </button>

        <div className="sidebar-divider" />

        {categories.map((cat) => (
          <div key={cat.key} className="sidebar-category">
            <button
              className="sidebar-category-header"
              onClick={() => toggleCategory(cat.key)}
            >
              <cat.icon size={16} />
              <span>{t(`sidebar.${cat.key}`)}</span>
              {expandedCategories.includes(cat.key) ? (
                <ChevronDown size={14} className="chevron" />
              ) : (
                <ChevronRight size={14} className="chevron" />
              )}
            </button>

            {expandedCategories.includes(cat.key) && (
              <motion.div
                className="sidebar-category-items"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {cat.items.map((item) => (
                  <button
                    key={item.key}
                    className={`sidebar-subitem ${currentPage === item.page ? "active" : ""}`}
                    onClick={() => onNavigate(item.page)}
                  >
                    <item.icon size={14} />
                    <span>{t(`tools.${item.key}`)}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}

        <div className="sidebar-divider" />

        <button
          className={`sidebar-item ${currentPage === "history" ? "active" : ""}`}
          onClick={() => onNavigate("history")}
        >
          <ClipboardList size={18} />
          <span>{t("sidebar.history") || "History"}</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "report" ? "active" : ""}`}
          onClick={() => onNavigate("report")}
        >
          <FileBarChart size={18} />
          <span>{t("sidebar.report") || "Report"}</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "scheduler" ? "active" : ""}`}
          onClick={() => onNavigate("scheduler")}
        >
          <Calendar size={18} />
          <span>{t("sidebar.scheduler") || "Scheduler"}</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "projects" ? "active" : ""}`}
          onClick={() => onNavigate("projects")}
        >
          <FolderOpen size={18} />
          <span>{t("sidebar.projects") || "Projects"}</span>
        </button>

        <div className="sidebar-divider" />

        <button
          className={`sidebar-item ${currentPage === "guide" ? "active" : ""}`}
          onClick={() => onNavigate("guide")}
        >
          <BookOpen size={18} />
          <span>{t("sidebar.guide") || "Guide"}</span>
        </button>

        <button
          className={`sidebar-item ${currentPage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <Settings size={18} />
          <span>{t("settings.title")}</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0</span>
        <span className="sidebar-credit">{t("app.madeBy")}</span>
      </div>
    </aside>
  );
}
