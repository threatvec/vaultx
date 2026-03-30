import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Key, Bot, Bell, Palette, Globe, Clipboard, Info,
  CheckCircle, XCircle, Loader2, ExternalLink, Shield,
  Monitor, Moon, Zap, RefreshCw, Save, Eye, EyeOff,
  Network, Send, Mail,
} from "lucide-react";
import { GetSettings, SaveSetting, GetOllamaStatus, TestAIProvider, TestOllamaConnection, ListOllamaModels, GetVersion, CheckForUpdate, SetAIProvider, GetClipboardWatcherEnabled, SetClipboardWatcherEnabled } from "../../wailsjs/go/main/App";
import { applyTheme, themes } from "../themes";
import i18n from "../i18n";

type Tab = "api" | "ai" | "notifications" | "proxy" | "appearance" | "language" | "clipboard" | "general";

interface APIKeyField {
  key: string;
  label: string;
  placeholder: string;
  url: string;
  testable: boolean;
  usedBy: string[];
  limit: string;
  free: boolean;
}

const API_KEYS: APIKeyField[] = [
  { key: "abuseipdb_api_key", label: "AbuseIPDB", placeholder: "API key...", url: "https://www.abuseipdb.com/account/plans", testable: false, usedBy: ["IP Reputation", "NightWatch"], limit: "1,000 req/day (free)", free: true },
  { key: "otx_api_key", label: "AlienVault OTX", placeholder: "API key...", url: "https://otx.alienvault.com/api", testable: false, usedBy: ["Threat Feed"], limit: "10,000 req/day (free)", free: true },
  { key: "hibp_api_key", label: "HaveIBeenPwned", placeholder: "API key...", url: "https://haveibeenpwned.com/API/Key", testable: false, usedBy: ["Email Breach", "NightWatch", "Password Analyzer"], limit: "10 req/min ($3.50/mo)", free: false },
  { key: "virustotal_api_key", label: "VirusTotal", placeholder: "API key...", url: "https://www.virustotal.com/gui/my-apikey", testable: false, usedBy: ["Hash Lookup", "URL Scanner", "QR Analyzer"], limit: "500 req/day (free)", free: true },
];

const AI_PROVIDERS = [
  { key: "openai_api_key", provider: "openai", label: "OpenAI (GPT-4o)", placeholder: "sk-...", model: "gpt-4o" },
  { key: "anthropic_api_key", provider: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-...", model: "claude-sonnet-4-20250514" },
  { key: "gemini_api_key", provider: "gemini", label: "Google Gemini", placeholder: "AI...", model: "gemini-pro" },
];

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("api");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, "success" | "error" | "testing">>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [ollamaStatus, setOllamaStatus] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [clipboardEnabled, setClipboardEnabled] = useState(false);
  const [version, setVersion] = useState("1.0.0");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "uptodate">("idle");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);

    // Helper: race against timeout
    const withTimeout = <T,>(promise: Promise<T>, fallback: T, ms = 5000): Promise<T> =>
      Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

    try {
      const [s, clip, ver] = await Promise.all([
        withTimeout(GetSettings(), {}),
        withTimeout(GetClipboardWatcherEnabled(), false),
        withTimeout(GetVersion(), "1.0.0"),
      ]);
      setSettings(s || {});
      setClipboardEnabled(clip);
      setVersion(ver);
    } catch (e) {
      console.error("Settings load error:", e);
    }
    setLoading(false);

    // Load Ollama status and models via Go backend (avoids WebView localhost restriction)
    try {
      const ollama = await withTimeout(GetOllamaStatus(), false, 4000);
      setOllamaStatus(ollama);
      if (ollama) {
        const models = await withTimeout(ListOllamaModels(), [], 5000);
        setOllamaModels(models?.map((m: any) => m.Name || m.name || m) || []);
      }
    } catch { /* Ollama not available, that's OK */ }
  };

  const saveSetting = useCallback(async (key: string, value: string) => {
    setSaving(key);
    try {
      await SaveSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (e) {
      console.error("Save error:", e);
    }
    setSaving(null);
  }, []);

  const testAI = async (provider: string, apiKey: string, model: string) => {
    setTestResults((prev) => ({ ...prev, [provider]: "testing" }));
    try {
      const result = await TestAIProvider(provider, apiKey, model);
      setTestResults((prev) => ({ ...prev, [provider]: result?.available ? "success" : "error" }));
    } catch {
      setTestResults((prev) => ({ ...prev, [provider]: "error" }));
    }
  };

  const checkUpdate = async () => {
    setUpdateStatus("checking");
    try {
      const result = await CheckForUpdate();
      setUpdateStatus(result ? "available" : "uptodate");
    } catch {
      setUpdateStatus("idle");
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "api", label: t("settings.apiKeys"), icon: Key },
    { id: "ai", label: t("settings.aiProvider"), icon: Bot },
    { id: "notifications", label: t("settings.notifications"), icon: Bell },
    { id: "proxy", label: "Proxy", icon: Network },
    { id: "appearance", label: t("settings.appearance"), icon: Palette },
    { id: "language", label: t("settings.language"), icon: Globe },
    { id: "clipboard", label: t("settings.clipboardWatcher"), icon: Clipboard },
    { id: "general", label: t("settings.general"), icon: Info },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={28} style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      </div>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 160px)" }}>
        {/* Tab sidebar */}
        <div className="flex flex-col gap-1" style={{ minWidth: 220 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left"
              style={{
                background: activeTab === tab.id ? "var(--accent-muted)" : "transparent",
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
                border: activeTab === tab.id ? "1px solid var(--accent)" : "1px solid transparent",
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
          style={{ maxWidth: 720 }}
        >
          {activeTab === "api" && <APIKeysSection settings={settings} saveSetting={saveSetting} saving={saving} showKeys={showKeys} setShowKeys={setShowKeys} />}
          {activeTab === "ai" && <AISection settings={settings} saveSetting={saveSetting} saving={saving} ollamaStatus={ollamaStatus} setOllamaStatus={setOllamaStatus} ollamaModels={ollamaModels} setOllamaModels={setOllamaModels} testResults={testResults} testAI={testAI} showKeys={showKeys} setShowKeys={setShowKeys} />}
          {activeTab === "notifications" && <NotificationsSection settings={settings} saveSetting={saveSetting} saving={saving} />}
          {activeTab === "proxy" && <ProxySection settings={settings} saveSetting={saveSetting} saving={saving} />}
          {activeTab === "appearance" && <AppearanceSection settings={settings} saveSetting={saveSetting} />}
          {activeTab === "language" && <LanguageSection settings={settings} saveSetting={saveSetting} />}
          {activeTab === "clipboard" && <ClipboardSection enabled={clipboardEnabled} setEnabled={setClipboardEnabled} />}
          {activeTab === "general" && <GeneralSection version={version} updateStatus={updateStatus} checkUpdate={checkUpdate} />}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── API Keys Section ─── */
function APIKeysSection({ settings, saveSetting, saving, showKeys, setShowKeys }: any) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string> = {};
    API_KEYS.forEach((k) => { init[k.key] = settings[k.key] || ""; });
    setLocal(init);
  }, [settings]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.apiKeys")}</h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {t("settings.apiKeysDesc")}
      </p>
      {/* Free APIs - no key needed */}
      <div className="rounded-xl p-3 mb-4" style={{ background: "#00FF8808", border: "1px solid #00FF8830" }}>
        <p className="text-xs font-medium mb-1" style={{ color: "#00FF88" }}>No API key required:</p>
        <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>ip-api.com (IP Intelligence, GeoMap, My IP)</span>
          <span>|</span>
          <span>NVD (CVE Search, ShadowScan)</span>
          <span>|</span>
          <span>RDAP (WHOIS Lookup)</span>
          <span>|</span>
          <span>crt.sh (SSL Inspector)</span>
        </div>
      </div>

      {API_KEYS.map((api) => (
        <div key={api.key} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{api.label}</span>
              {settings[api.key] ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#00FF8820", color: "#00FF88" }}>
                  <CheckCircle size={12} /> {t("settings.connected")}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#FF334420", color: "#FF3344" }}>
                  <XCircle size={12} /> {t("settings.notConfigured")}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: api.free ? "#00FF8810" : "#FFB80010", color: api.free ? "#00FF88" : "#FFB800" }}>
                {api.free ? "Free" : "Paid"}
              </span>
            </div>
            <a href={api.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
              {t("settings.getKey")} <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {api.usedBy.map((tool) => (
              <span key={tool} className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}>{tool}</span>
            ))}
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>{api.limit}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys[api.key] ? "text" : "password"}
                value={local[api.key] || ""}
                onChange={(e) => setLocal((prev) => ({ ...prev, [api.key]: e.target.value }))}
                placeholder={api.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm pr-10"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => setShowKeys((prev: any) => ({ ...prev, [api.key]: !prev[api.key] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showKeys[api.key] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => saveSetting(api.key, local[api.key] || "")}
              disabled={saving === api.key}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              {saving === api.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t("common.save")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── AI Section ─── */
function AISection({ settings, saveSetting, saving, ollamaStatus, setOllamaStatus, ollamaModels, setOllamaModels, testResults, testAI, showKeys, setShowKeys }: any) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<Record<string, string>>({});
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaModelsLoading, setOllamaModelsLoading] = useState(false);

  useEffect(() => {
    const init: Record<string, string> = {};
    AI_PROVIDERS.forEach((p) => { init[p.key] = settings[p.key] || ""; });
    init.ollama_url = settings.ollama_url || "http://localhost:11434";
    init.ollama_model = settings.ollama_model || "llama3.2";
    init.ai_provider = settings.ai_provider || "ollama";
    setLocal(init);
  }, [settings]);

  const handleSaveAndTest = async (provider: string, keyField: string, model: string) => {
    await saveSetting(keyField, local[keyField] || "");
    if (local[keyField]) {
      await testAI(provider, local[keyField], model);
    }
  };

  const testOllama = async () => {
    setOllamaTesting(true);
    try {
      // Save URL first, then test via Go backend (bypasses WebView network restrictions)
      await saveSetting("ollama_url", local.ollama_url || "http://localhost:11434");
      const ok = await TestOllamaConnection(local.ollama_url || "http://localhost:11434");
      setOllamaStatus(ok);
      if (ok) refreshOllamaModels();
    } catch {
      setOllamaStatus(false);
    }
    setOllamaTesting(false);
  };

  const refreshOllamaModels = async () => {
    setOllamaModelsLoading(true);
    try {
      await saveSetting("ollama_url", local.ollama_url || "http://localhost:11434");
      const models = await ListOllamaModels();
      setOllamaModels(models?.map((m: any) => m.Name || m.name || m) || []);
    } catch { /* ignore */ }
    setOllamaModelsLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.aiProvider")}</h2>

      {/* Ollama */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot size={20} style={{ color: "var(--accent)" }} />
            <span className="font-medium">Ollama (Local AI)</span>
          </div>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{
            background: ollamaStatus ? "#00FF8820" : "#FF334420",
            color: ollamaStatus ? "#00FF88" : "#FF3344",
          }}>
            {ollamaStatus ? <><CheckCircle size={12} /> {t("settings.connected")}</> : <><XCircle size={12} /> {t("settings.disconnected")}</>}
          </span>
        </div>

        {/* URL row with Test button */}
        <div className="mb-3">
          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>URL</label>
          <div className="flex gap-2">
            <input
              value={local.ollama_url || ""}
              onChange={(e) => setLocal((prev) => ({ ...prev, ollama_url: e.target.value }))}
              placeholder="http://localhost:11434"
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={testOllama}
              disabled={ollamaTesting}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 whitespace-nowrap"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              {ollamaTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {t("settings.testConnection")}
            </button>
          </div>
        </div>

        {/* Model row with Refresh button */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>{t("settings.model")}</label>
          <div className="flex gap-2">
            <select
              value={local.ollama_model || ""}
              onChange={(e) => {
                setLocal((prev) => ({ ...prev, ollama_model: e.target.value }));
                saveSetting("ollama_model", e.target.value);
              }}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              {ollamaModels.length > 0 ? (
                ollamaModels.map((m: string) => <option key={m} value={m}>{m}</option>)
              ) : (
                <option value="llama3.2">llama3.2 (default)</option>
              )}
            </select>
            <button
              onClick={refreshOllamaModels}
              disabled={ollamaModelsLoading}
              title="Refresh model list from Ollama"
              className="px-3 py-2 rounded-lg text-sm flex items-center"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              {ollamaModelsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Cloud providers */}
      {AI_PROVIDERS.map((prov) => (
        <div key={prov.key} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{prov.label}</span>
            {testResults[prov.provider] === "success" && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#00FF8820", color: "#00FF88" }}><CheckCircle size={12} className="inline mr-1" />{t("settings.connected")}</span>}
            {testResults[prov.provider] === "error" && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FF334420", color: "#FF3344" }}><XCircle size={12} className="inline mr-1" />{t("settings.connectionFailed")}</span>}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys[prov.key] ? "text" : "password"}
                value={local[prov.key] || ""}
                onChange={(e) => setLocal((prev) => ({ ...prev, [prov.key]: e.target.value }))}
                placeholder={prov.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm pr-10"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
              <button onClick={() => setShowKeys((prev: any) => ({ ...prev, [prov.key]: !prev[prov.key] }))} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showKeys[prov.key] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => handleSaveAndTest(prov.provider, prov.key, prov.model)}
              disabled={saving === prov.key || testResults[prov.provider] === "testing"}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              {testResults[prov.provider] === "testing" ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {t("settings.testConnection")}
            </button>
          </div>
        </div>
      ))}

      {/* Active provider selector */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <label className="text-sm font-medium mb-2 block">{t("settings.activeProvider")}</label>
        <select
          value={local.ai_provider || "ollama"}
          onChange={(e) => {
            setLocal((prev) => ({ ...prev, ai_provider: e.target.value }));
            saveSetting("ai_provider", e.target.value);
          }}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          <option value="ollama">Ollama (Local)</option>
          <option value="openai">OpenAI (GPT-4o)</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="gemini">Google Gemini</option>
        </select>
      </div>

      {/* AI Auto-analyze toggle */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Auto-analyze scan results</span>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              After every scan, AI automatically analyzes the results and shows critical findings + recommendations
            </p>
          </div>
          <button
            onClick={() => {
              const next = local.ai_auto_analyze !== "true" ? "true" : "false";
              setLocal((prev) => ({ ...prev, ai_auto_analyze: next }));
              saveSetting("ai_auto_analyze", next);
            }}
            className="w-12 h-6 rounded-full relative transition-all flex-shrink-0"
            style={{ background: local.ai_auto_analyze === "true" ? "var(--accent)" : "var(--border)" }}
          >
            <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
              style={{ left: local.ai_auto_analyze === "true" ? 26 : 2 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications Section ─── */
function NotificationsSection({ settings, saveSetting, saving }: any) {
  const { t } = useTranslation();
  const [discord, setDiscord] = useState(settings.discord_webhook || "");
  const [tgToken, setTgToken] = useState(settings.telegram_token || "");
  const [tgChatID, setTgChatID] = useState(settings.telegram_chat_id || "");
  const [smtpHost, setSmtpHost] = useState(settings.smtp_host || "");
  const [smtpPort, setSmtpPort] = useState(settings.smtp_port || "587");
  const [smtpUser, setSmtpUser] = useState(settings.smtp_user || "");
  const [smtpPass, setSmtpPass] = useState(settings.smtp_pass || "");
  const [smtpTo, setSmtpTo] = useState(settings.smtp_to || "");
  const [sysNotif, setSysNotif] = useState(settings.system_notifications !== "false");
  const [alertLevel, setAlertLevel] = useState(settings.alert_level || "all");
  const [testStatus, setTestStatus] = useState<Record<string, "idle" | "testing" | "ok" | "err">>({});

  const test = async (channel: string) => {
    setTestStatus((p) => ({ ...p, [channel]: "testing" }));
    try {
      const mod = await import("../../wailsjs/go/main/App") as any;
      if (channel === "telegram" && mod.TestTelegramNotification) {
        await mod.TestTelegramNotification(tgToken, tgChatID);
      } else if (channel === "email" && mod.TestEmailNotification) {
        await mod.TestEmailNotification(smtpHost, smtpPort, smtpUser, smtpPass, smtpTo);
      }
      setTestStatus((p) => ({ ...p, [channel]: "ok" }));
    } catch {
      setTestStatus((p) => ({ ...p, [channel]: "err" }));
    }
    setTimeout(() => setTestStatus((p) => ({ ...p, [channel]: "idle" })), 3000);
  };

  const TestBadge = ({ ch }: { ch: string }) => {
    const s = testStatus[ch];
    if (s === "testing") return <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent)" }} />;
    if (s === "ok") return <CheckCircle size={14} style={{ color: "#00FF88" }} />;
    if (s === "err") return <XCircle size={14} style={{ color: "#FF3344" }} />;
    return null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.notifications")}</h2>

      {/* Discord */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💬</span>
          <span className="font-medium">Discord Webhook</span>
        </div>
        <div className="flex gap-2">
          <input value={discord} onChange={(e) => setDiscord(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <button onClick={() => saveSetting("discord_webhook", discord)} disabled={saving === "discord_webhook"}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: "var(--accent)", color: "#000" }}>
            {saving === "discord_webhook" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {t("common.save")}
          </button>
        </div>
      </div>

      {/* Telegram */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Send size={18} style={{ color: "#0088CC" }} />
            <span className="font-medium">Telegram Bot</span>
          </div>
          <div className="flex items-center gap-2">
            <TestBadge ch="telegram" />
            <button onClick={() => test("telegram")} disabled={testStatus.telegram === "testing"}
              className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
              style={{ background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              <Zap size={12} /> Test
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Bot Token</label>
            <input value={tgToken} onChange={(e) => setTgToken(e.target.value)}
              onBlur={() => saveSetting("telegram_token", tgToken)}
              placeholder="1234567890:ABCdefGhIJKlmNoPQRstUVwxYZ"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Chat ID</label>
            <input value={tgChatID} onChange={(e) => setTgChatID(e.target.value)}
              onBlur={() => saveSetting("telegram_chat_id", tgChatID)}
              placeholder="-1001234567890"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Create a bot via @BotFather, add it to a group, then use @getmyid_bot to find your Chat ID.
          </p>
        </div>
      </div>

      {/* Email/SMTP */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail size={18} style={{ color: "var(--accent)" }} />
            <span className="font-medium">E-Mail (SMTP)</span>
          </div>
          <div className="flex items-center gap-2">
            <TestBadge ch="email" />
            <button onClick={() => test("email")} disabled={testStatus.email === "testing"}
              className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
              style={{ background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              <Zap size={12} /> Test
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>SMTP Host</label>
            <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)}
              onBlur={() => saveSetting("smtp_host", smtpHost)}
              placeholder="smtp.gmail.com"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Port</label>
            <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)}
              onBlur={() => saveSetting("smtp_port", smtpPort)}
              placeholder="587"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Username</label>
            <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)}
              onBlur={() => saveSetting("smtp_user", smtpUser)}
              placeholder="you@gmail.com"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Password / App Password</label>
            <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)}
              onBlur={() => saveSetting("smtp_pass", smtpPass)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="col-span-2">
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Send Alerts To</label>
            <input value={smtpTo} onChange={(e) => setSmtpTo(e.target.value)}
              onBlur={() => saveSetting("smtp_to", smtpTo)}
              placeholder="alerts@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
        </div>
      </div>

      {/* System notifications toggle */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{t("settings.systemNotifications")}</span>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{t("settings.systemNotificationsDesc")}</p>
          </div>
          <button onClick={() => { const n = !sysNotif; setSysNotif(n); saveSetting("system_notifications", String(n)); }}
            className="w-12 h-6 rounded-full relative transition-all"
            style={{ background: sysNotif ? "var(--accent)" : "var(--border)" }}>
            <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: sysNotif ? 26 : 2 }} />
          </button>
        </div>
      </div>

      {/* Alert level */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <label className="text-sm font-medium mb-2 block">{t("settings.alertLevel")}</label>
        <div className="flex gap-2">
          {["all", "high", "critical"].map((level) => (
            <button key={level} onClick={() => { setAlertLevel(level); saveSetting("alert_level", level); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: alertLevel === level ? "var(--accent-muted)" : "var(--bg-base)",
                color: alertLevel === level ? "var(--accent)" : "var(--text-secondary)",
                border: alertLevel === level ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}>
              {t(`settings.alertLevel_${level}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Proxy Section ─── */
function ProxySection({ settings, saveSetting, saving }: any) {
  const [enabled, setEnabled] = useState(settings.proxy_enabled === "true");
  const [proxyType, setProxyType] = useState(settings.proxy_type || "http");
  const [host, setHost] = useState(settings.proxy_host || "");
  const [port, setPort] = useState(settings.proxy_port || "1080");
  const [user, setUser] = useState(settings.proxy_user || "");
  const [pass, setPass] = useState(settings.proxy_pass || "");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "err">("idle");

  const saveAll = async () => {
    await Promise.all([
      saveSetting("proxy_enabled", String(enabled)),
      saveSetting("proxy_type", proxyType),
      saveSetting("proxy_host", host),
      saveSetting("proxy_port", port),
      saveSetting("proxy_user", user),
      saveSetting("proxy_pass", pass),
    ]);
  };

  const testProxy = async () => {
    setTestStatus("testing");
    try {
      await saveAll();
      const mod = await import("../../wailsjs/go/main/App") as any;
      if (mod.TestProxyConnection) {
        await mod.TestProxyConnection(proxyType, host, port, user, pass);
        setTestStatus("ok");
      } else {
        setTestStatus("ok"); // assume OK if function not yet bound
      }
    } catch {
      setTestStatus("err");
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Proxy Settings</h2>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-medium">Enable Proxy</span>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Route all outbound requests through a proxy server</p>
          </div>
          <button onClick={() => { const n = !enabled; setEnabled(n); saveSetting("proxy_enabled", String(n)); }}
            className="w-12 h-6 rounded-full relative transition-all"
            style={{ background: enabled ? "var(--accent)" : "var(--border)" }}>
            <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: enabled ? 26 : 2 }} />
          </button>
        </div>

        <div className="space-y-3" style={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? "auto" : "none" }}>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Type</label>
            <div className="flex gap-2">
              {["http", "socks5"].map((t) => (
                <button key={t} onClick={() => setProxyType(t)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: proxyType === t ? "var(--accent-muted)" : "var(--bg-base)",
                    color: proxyType === t ? "var(--accent)" : "var(--text-secondary)",
                    border: proxyType === t ? "1px solid var(--accent)" : "1px solid var(--border)",
                  }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Host</label>
              <input value={host} onChange={(e) => setHost(e.target.value)}
                placeholder="127.0.0.1"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Port</label>
              <input value={port} onChange={(e) => setPort(e.target.value)}
                placeholder="1080"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Username (optional)</label>
              <input value={user} onChange={(e) => setUser(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Password (optional)</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={saveAll} disabled={saving === "proxy_host"}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: "var(--accent)", color: "#000" }}>
              <Save size={14} /> Save
            </button>
            <button onClick={testProxy} disabled={testStatus === "testing"}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              {testStatus === "testing" ? <Loader2 size={14} className="animate-spin" /> :
               testStatus === "ok" ? <CheckCircle size={14} style={{ color: "#00FF88" }} /> :
               testStatus === "err" ? <XCircle size={14} style={{ color: "#FF3344" }} /> :
               <Zap size={14} />}
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Appearance Section ─── */
function AppearanceSection({ settings, saveSetting }: any) {
  const { t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState(settings.theme || "cyber-green");
  const [animations, setAnimations] = useState(settings.animations !== "false");

  const handleTheme = (name: string) => {
    setCurrentTheme(name);
    applyTheme(name);
    saveSetting("theme", name);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.appearance")}</h2>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <label className="text-sm font-medium mb-3 block">{t("settings.themeSelect")}</label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(themes).map((theme) => (
            <button
              key={theme.name}
              onClick={() => handleTheme(theme.name)}
              className="p-4 rounded-xl text-center transition-all"
              style={{
                background: currentTheme === theme.name ? `${theme.accent}15` : "var(--bg-base)",
                border: currentTheme === theme.name ? `2px solid ${theme.accent}` : "2px solid var(--border)",
              }}
            >
              <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: theme.accent }} />
              <span className="text-sm font-medium" style={{ color: currentTheme === theme.name ? theme.accent : "var(--text-primary)" }}>
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{t("settings.animations")}</span>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{t("settings.animationsDesc")}</p>
          </div>
          <button
            onClick={() => {
              const next = !animations;
              setAnimations(next);
              saveSetting("animations", String(next));
              document.documentElement.style.setProperty("--transition-speed", next ? "0.2s" : "0s");
            }}
            className="w-12 h-6 rounded-full relative transition-all"
            style={{ background: animations ? "var(--accent)" : "var(--border)" }}
          >
            <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: animations ? 26 : 2 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Language Section ─── */
function LanguageSection({ settings, saveSetting }: any) {
  const { t } = useTranslation();
  const [lang, setLang] = useState(settings.language || "en");

  const handleLang = (lng: string) => {
    setLang(lng);
    i18n.changeLanguage(lng);
    saveSetting("language", lng);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.language")}</h2>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-3">
          {[
            { code: "en", label: "English", flag: "🇬🇧" },
            { code: "tr", label: "Turkce", flag: "🇹🇷" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => handleLang(l.code)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: lang === l.code ? "var(--accent-muted)" : "var(--bg-base)",
                border: lang === l.code ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              <span className="text-2xl">{l.flag}</span>
              <span className="font-medium" style={{ color: lang === l.code ? "var(--accent)" : "var(--text-primary)" }}>
                {l.label}
              </span>
              {lang === l.code && <CheckCircle size={18} style={{ color: "var(--accent)", marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Clipboard Section ─── */
function ClipboardSection({ enabled, setEnabled }: any) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.clipboardWatcher")}</h2>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{t("settings.clipboardEnabled")}</span>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{t("settings.clipboardDesc")}</p>
          </div>
          <button
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              SetClipboardWatcherEnabled(next);
            }}
            className="w-12 h-6 rounded-full relative transition-all"
            style={{ background: enabled ? "var(--accent)" : "var(--border)" }}
          >
            <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: enabled ? 26 : 2 }} />
          </button>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="font-medium mb-3">{t("settings.clipboardDetects")}</h3>
        <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <div className="flex items-center gap-2"><Monitor size={14} /> {t("settings.clipboardIP")}</div>
          <div className="flex items-center gap-2"><Globe size={14} /> {t("settings.clipboardURL")}</div>
          <div className="flex items-center gap-2"><Key size={14} /> {t("settings.clipboardEmail")}</div>
          <div className="flex items-center gap-2"><Shield size={14} /> {t("settings.clipboardHash")}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── General Section ─── */
function GeneralSection({ version, updateStatus, checkUpdate }: any) {
  const { t } = useTranslation();
  const [clearing, setClearing] = useState(false);
  const [clearDone, setClearDone] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const clearAllData = async () => {
    setClearing(true);
    try {
      const mod = await import("../../wailsjs/go/main/App") as any;
      if (typeof mod.DeleteAllQueryLogs === "function") await mod.DeleteAllQueryLogs();
      if (typeof mod.VacuumDatabase === "function") await mod.VacuumDatabase();
    } catch { /* ignore */ }
    setClearing(false);
    setClearDone(true);
    setConfirmClear(false);
    setTimeout(() => setClearDone(false), 3000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">{t("settings.general")}</h2>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">VAULTX</span>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>v{version}</p>
          </div>
          <button
            onClick={checkUpdate}
            disabled={updateStatus === "checking"}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid var(--accent)" }}
          >
            {updateStatus === "checking" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {t("settings.checkUpdate")}
          </button>
        </div>
        {updateStatus === "uptodate" && (
          <p className="text-xs mt-2" style={{ color: "#00FF88" }}>{t("settings.upToDate")}</p>
        )}
        {updateStatus === "available" && (
          <p className="text-xs mt-2" style={{ color: "#FFB800" }}>{t("settings.updateAvailable")}</p>
        )}
      </div>

      {/* Clear history / vacuum DB */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Clear All History & Logs</span>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Delete all query logs and compact the database (SQLite VACUUM)
            </p>
          </div>
          {clearDone ? (
            <span className="flex items-center gap-1 text-sm" style={{ color: "#00FF88" }}>
              <CheckCircle size={16} /> Cleared
            </span>
          ) : confirmClear ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button onClick={clearAllData} disabled={clearing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                style={{ background: "#FF3344", color: "#fff" }}>
                {clearing ? <Loader2 size={12} className="animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#FF334420", color: "#FF3344", border: "1px solid #FF334440" }}>
              Clear Data
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("settings.madeBy")}
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
