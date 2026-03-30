import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EventsOn } from "../wailsjs/runtime/runtime";
import { BrowserOpenURL } from "../wailsjs/runtime/runtime";

import "./i18n";
import { applyTheme } from "./themes";

import Sidebar from "./components/Sidebar";
import UpdateModal from "./components/UpdateModal";
import CommandPalette from "./components/CommandPalette";
import AIAssistant from "./components/AIAssistant";
import ClipboardToast from "./components/ClipboardToast";
import OnboardingWizard from "./components/OnboardingWizard";
import Dashboard from "./pages/Dashboard";
import ScanMe from "./pages/ScanMe";
import Guide from "./pages/Guide";
import SettingsPage from "./pages/Settings";
import ComingSoon from "./components/ComingSoon";

// Domain pages (lazy loaded)
const ShadowScan    = lazy(() => import("./pages/domain/ShadowScan"));
const URLScanner    = lazy(() => import("./pages/domain/URLScanner"));
const WHOISLookup   = lazy(() => import("./pages/domain/WHOISLookup"));
const DNSAnalyzer   = lazy(() => import("./pages/domain/DNSAnalyzer"));
const SSLInspector  = lazy(() => import("./pages/domain/SSLInspector"));
const HTTPHeaders   = lazy(() => import("./pages/domain/HTTPHeaders"));
const WebFingerprint = lazy(() => import("./pages/domain/WebFingerprint"));
const PhishingDetect = lazy(() => import("./pages/domain/PhishingDetect"));
const GoogleDorks   = lazy(() => import("./pages/domain/GoogleDorks"));

// Threat pages (lazy loaded)
const NightWatch    = lazy(() => import("./pages/threat/NightWatch"));
const IPReputation  = lazy(() => import("./pages/threat/IPReputation"));
const CVESearch     = lazy(() => import("./pages/threat/CVESearch"));
const PasteMonitor  = lazy(() => import("./pages/threat/PasteMonitor"));
const ThreatFeed    = lazy(() => import("./pages/threat/ThreatFeed"));

// Network pages (lazy loaded)
const IPIntelligence = lazy(() => import("./pages/network/IPIntelligence"));
const GeoMap         = lazy(() => import("./pages/network/GeoMap"));
const PortScanner    = lazy(() => import("./pages/network/PortScanner"));
const NetworkTools   = lazy(() => import("./pages/network/NetworkTools"));
const MyIPInfo       = lazy(() => import("./pages/network/MyIPInfo"));
const BGPLookup      = lazy(() => import("./pages/network/BGPLookup"));

// File pages (lazy loaded)
const MetadataExtractor  = lazy(() => import("./pages/files/MetadataExtractor"));
const ImageEXIF          = lazy(() => import("./pages/files/ImageEXIF"));
const HashLookup         = lazy(() => import("./pages/files/HashLookup"));
const HashGenerator      = lazy(() => import("./pages/files/HashGenerator"));
const QRAnalyzer         = lazy(() => import("./pages/files/QRAnalyzer"));
const DocumentAnalyzer   = lazy(() => import("./pages/files/DocumentAnalyzer"));

// Auth & Security pages (lazy loaded)
const PasswordAnalyzer  = lazy(() => import("./pages/auth/PasswordAnalyzer"));
const PasswordGenerator = lazy(() => import("./pages/auth/PasswordGenerator"));
const EmailHeader       = lazy(() => import("./pages/auth/EmailHeader"));
const TOTPGenerator     = lazy(() => import("./pages/auth/TOTPGenerator"));
const EncoderDecoder    = lazy(() => import("./pages/auth/EncoderDecoder"));

// AI pages (lazy loaded)
const AIAssistantPage   = lazy(() => import("./pages/ai/AIAssistantPage"));
const AIRiskAnalysis    = lazy(() => import("./pages/ai/AIRiskAnalysis"));
const AIReport          = lazy(() => import("./pages/ai/AIReport"));

// Identity pages (lazy loaded)
const UsernameSearch       = lazy(() => import("./pages/identity/UsernameSearch"));
const EmailBreach          = lazy(() => import("./pages/identity/EmailBreach"));
const PhoneLookup          = lazy(() => import("./pages/identity/PhoneLookup"));
const WaybackViewer        = lazy(() => import("./pages/identity/WaybackViewer"));
const GoogleDorksIdentity  = lazy(() => import("./pages/identity/GoogleDorksIdentity"));
const OSINTDashboard       = lazy(() => import("./pages/identity/OSINTDashboard"));

// New feature pages (lazy loaded)
const HistoryPage    = lazy(() => import("./pages/History"));
const ReportPage     = lazy(() => import("./pages/Report"));
const SchedulerPage  = lazy(() => import("./pages/Scheduler"));
const ProjectsPage   = lazy(() => import("./pages/Projects"));
const TopologyMap    = lazy(() => import("./pages/network/TopologyMap"));

function PageLoader() {
  return (
    <div className="page-container">
      <div className="tool-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { GetSettings } = await import("../wailsjs/go/main/App");
        const s = await GetSettings();
        applyTheme(s?.theme || "cyber-green");
        // Show onboarding if first launch
        if (!s?.onboarded) {
          setShowOnboarding(true);
        }
      } catch {
        applyTheme("cyber-green");
      }
    })();
  }, []);

  useEffect(() => {
    const cancel = EventsOn("update:available", (version: string) => {
      setUpdateVersion(version);
    });
    return () => cancel();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = useCallback((page: string, _query?: string) => {
    setCurrentPage(page);
  }, []);

  const handleDownloadUpdate = () => {
    BrowserOpenURL("https://github.com/threatvec/vaultx/releases/latest");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":        return <Dashboard onNavigate={navigate} />;
      case "scan-me":          return <ScanMe />;
      case "guide":            return <Guide onNavigate={navigate} />;
      // Domain & Web
      case "shadow-scan":      return <ShadowScan />;
      case "url-scanner":      return <URLScanner />;
      case "whois-lookup":     return <WHOISLookup />;
      case "dns-analyzer":     return <DNSAnalyzer />;
      case "ssl-inspector":    return <SSLInspector />;
      case "http-headers":     return <HTTPHeaders />;
      case "web-fingerprint":  return <WebFingerprint />;
      case "phishing-detector": return <PhishingDetect />;
      case "google-dorks":     return <GoogleDorks />;
      // Cyber Threat
      case "night-watch":      return <NightWatch />;
      case "ip-reputation":    return <IPReputation />;
      case "cve-search":       return <CVESearch />;
      case "paste-monitor":    return <PasteMonitor />;
      case "threat-feed":      return <ThreatFeed />;
      // Network & IP
      case "ip-intelligence":  return <IPIntelligence />;
      case "geo-map":          return <GeoMap />;
      case "port-scanner":     return <PortScanner />;
      case "network-tools":    return <NetworkTools />;
      case "my-ip":            return <MyIPInfo />;
      case "bgp-lookup":       return <BGPLookup />;
      case "network-topology": return <TopologyMap />;
      // File & Analysis
      case "metadata-extractor": return <MetadataExtractor />;
      case "image-exif":         return <ImageEXIF />;
      case "hash-lookup":        return <HashLookup />;
      case "hash-generator":     return <HashGenerator />;
      case "qr-analyzer":        return <QRAnalyzer />;
      case "document-analyzer":  return <DocumentAnalyzer />;
      // Identity & OSINT
      case "username-search":    return <UsernameSearch />;
      case "email-breach":       return <EmailBreach />;
      case "phone-lookup":       return <PhoneLookup />;
      case "wayback-viewer":     return <WaybackViewer />;
      case "google-dorks-identity": return <GoogleDorksIdentity />;
      case "osint-dashboard":    return <OSINTDashboard />;
      // Auth & Security
      case "password-analyzer":  return <PasswordAnalyzer />;
      case "password-generator": return <PasswordGenerator />;
      case "email-header":       return <EmailHeader />;
      case "totp-generator":     return <TOTPGenerator />;
      case "encoder-decoder":    return <EncoderDecoder />;
      case "2fa-generator":      return <TOTPGenerator />;
      // AI Tools
      case "ai-assistant":       return <AIAssistantPage />;
      case "ai-risk-analysis":   return <AIRiskAnalysis />;
      case "ai-report":          return <AIReport />;
      // Settings
      case "settings":           return <SettingsPage />;
      // New feature pages
      case "history":            return <HistoryPage />;
      case "report":             return <ReportPage />;
      case "scheduler":          return <SchedulerPage />;
      case "projects":           return <ProjectsPage />;
      default:
        return (
          <ComingSoon
            pageName={currentPage}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {updateVersion && (
        <UpdateModal version={updateVersion} onDownload={handleDownloadUpdate} />
      )}

      <Sidebar currentPage={currentPage} onNavigate={navigate} />

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="page-wrapper"
          >
            <Suspense fallback={<PageLoader />}>
              {renderPage()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={navigate}
      />

      <ClipboardToast onNavigate={navigate} />
      <AIAssistant />
    </div>
  );
}

export default App;
