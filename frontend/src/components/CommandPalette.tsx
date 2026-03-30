import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import {
  Globe,
  Shield,
  Network,
  FileSearch,
  User,
  Lock,
  Bot,
  ScanLine,
  LayoutDashboard,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface ToolItem {
  key: string;
  page: string;
  category: string;
}

const allTools: ToolItem[] = [
  { key: "shadowScan", page: "shadow-scan", category: "domainWeb" },
  { key: "urlScanner", page: "url-scanner", category: "domainWeb" },
  { key: "whoisLookup", page: "whois-lookup", category: "domainWeb" },
  { key: "dnsAnalyzer", page: "dns-analyzer", category: "domainWeb" },
  { key: "sslInspector", page: "ssl-inspector", category: "domainWeb" },
  { key: "httpHeaders", page: "http-headers", category: "domainWeb" },
  { key: "webFingerprint", page: "web-fingerprint", category: "domainWeb" },
  { key: "phishingDetector", page: "phishing-detector", category: "domainWeb" },
  { key: "nightWatch", page: "night-watch", category: "cyberThreat" },
  { key: "ipReputation", page: "ip-reputation", category: "cyberThreat" },
  { key: "cveSearch", page: "cve-search", category: "cyberThreat" },
  { key: "threatFeed", page: "threat-feed", category: "cyberThreat" },
  { key: "ipIntelligence", page: "ip-intelligence", category: "networkIp" },
  { key: "ipGeolocation", page: "ip-geolocation", category: "networkIp" },
  { key: "portScanner", page: "port-scanner", category: "networkIp" },
  { key: "networkTools", page: "network-tools", category: "networkIp" },
  { key: "myIpInfo", page: "my-ip-info", category: "networkIp" },
  { key: "bgpLookup", page: "bgp-lookup", category: "networkIp" },
  { key: "metadataExtractor", page: "metadata-extractor", category: "fileAnalysis" },
  { key: "imageExif", page: "image-exif", category: "fileAnalysis" },
  { key: "hashLookup", page: "hash-lookup", category: "fileAnalysis" },
  { key: "hashGenerator", page: "hash-generator", category: "fileAnalysis" },
  { key: "qrAnalyzer", page: "qr-analyzer", category: "fileAnalysis" },
  { key: "documentAnalyzer", page: "document-analyzer", category: "fileAnalysis" },
  { key: "usernameSearch", page: "username-search", category: "identityOsint" },
  { key: "emailBreach", page: "email-breach", category: "identityOsint" },
  { key: "phoneLookup", page: "phone-lookup", category: "identityOsint" },
  { key: "waybackViewer", page: "wayback-viewer", category: "identityOsint" },
  { key: "googleDorks", page: "google-dorks", category: "identityOsint" },
  { key: "osintDashboard", page: "osint-dashboard", category: "identityOsint" },
  { key: "passwordAnalyzer", page: "password-analyzer", category: "passwordSecurity" },
  { key: "passwordGenerator", page: "password-generator", category: "passwordSecurity" },
  { key: "emailHeader", page: "email-header", category: "passwordSecurity" },
  { key: "twoFaGenerator", page: "2fa-generator", category: "passwordSecurity" },
  { key: "encoderDecoder", page: "encoder-decoder", category: "passwordSecurity" },
  { key: "pasteMonitor", page: "paste-monitor", category: "passwordSecurity" },
  { key: "aiAssistant", page: "ai-assistant", category: "aiTools" },
  { key: "aiRiskAnalysis", page: "ai-risk-analysis", category: "aiTools" },
  { key: "aiReport", page: "ai-report", category: "aiTools" },
];

const categoryIcons: Record<string, React.ElementType> = {
  domainWeb: Globe,
  cyberThreat: Shield,
  networkIp: Network,
  fileAnalysis: FileSearch,
  identityOsint: User,
  passwordSecurity: Lock,
  aiTools: Bot,
};

export default function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  if (!open) return null;

  const handleSelect = (page: string) => {
    onNavigate(page);
    onClose();
  };

  return (
    <div className="command-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <Command>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={t("commandPalette.placeholder")}
            className="command-input"
          />
          <Command.List className="command-list">
            <Command.Empty>{t("common.noResults")}</Command.Empty>

            <Command.Item onSelect={() => handleSelect("dashboard")} className="command-item">
              <LayoutDashboard size={16} />
              <span>{t("sidebar.dashboard")}</span>
            </Command.Item>

            <Command.Item onSelect={() => handleSelect("scan-me")} className="command-item">
              <ScanLine size={16} />
              <span>{t("sidebar.scanMe")}</span>
            </Command.Item>

            {Object.entries(categoryIcons).map(([catKey, CatIcon]) => (
              <Command.Group key={catKey} heading={t(`sidebar.${catKey}`)}>
                {allTools
                  .filter((tool) => tool.category === catKey)
                  .map((tool) => (
                    <Command.Item
                      key={tool.key}
                      onSelect={() => handleSelect(tool.page)}
                      className="command-item"
                    >
                      <CatIcon size={14} />
                      <span>{t(`tools.${tool.key}`)}</span>
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
