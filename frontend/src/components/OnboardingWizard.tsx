import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Key, Clipboard, Rocket, ChevronRight, Shield } from "lucide-react";
import { SaveSetting, SetClipboardWatcherEnabled } from "../../wailsjs/go/main/App";
import i18n from "../i18n";

interface Props {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("en");
  const [clipboardEnabled, setClipboardEnabled] = useState(true);

  const totalSteps = 4;

  const handleLang = (lng: string) => {
    setLang(lng);
    i18n.changeLanguage(lng);
    SaveSetting("language", lng).catch(() => {});
  };

  const finish = async () => {
    try {
      await SaveSetting("onboarded", "true");
      SetClipboardWatcherEnabled(clipboardEnabled);
      if (clipboardEnabled) {
        await SaveSetting("clipboard_enabled", "true");
      }
    } catch { /* ignore */ }
    onComplete();
  };

  const nextStep = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ background: i <= step ? "var(--accent)" : "var(--border)" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent-muted)" }}>
                  <Shield size={40} style={{ color: "var(--accent)" }} />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t("onboarding.welcome")}</h2>
                <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{t("onboarding.slogan")}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>by threatvec & talkdedsec</p>
              </div>
            )}

            {/* Step 1: Language */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Globe size={24} style={{ color: "var(--accent)" }} />
                  <h2 className="text-xl font-bold">{t("onboarding.selectLanguage")}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { code: "en", label: "English", flag: "GB" },
                    { code: "tr", label: "Turkce", flag: "TR" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleLang(l.code)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        background: lang === l.code ? "var(--accent-muted)" : "var(--bg-base)",
                        border: lang === l.code ? "1px solid var(--accent)" : "1px solid var(--border)",
                        color: lang === l.code ? "var(--accent)" : "var(--text-primary)",
                      }}
                    >
                      <span className="text-lg font-bold">{l.flag}</span>
                      <span className="font-medium">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: API Keys */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Key size={24} style={{ color: "var(--accent)" }} />
                  <h2 className="text-xl font-bold">{t("onboarding.apiSetup")}</h2>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  {t("onboarding.apiSetupDesc")}
                </p>
                <div className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  {["AbuseIPDB", "AlienVault OTX", "HaveIBeenPwned", "VirusTotal"].map((name) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-base)" }}>
                      <Key size={14} style={{ color: "var(--accent)" }} />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                  {t("common.configureInSettings")}
                </p>
              </div>
            )}

            {/* Step 3: Clipboard */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Clipboard size={24} style={{ color: "var(--accent)" }} />
                  <h2 className="text-xl font-bold">{t("onboarding.clipboardQuestion")}</h2>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  {t("onboarding.clipboardQuestionDesc")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setClipboardEnabled(true)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: clipboardEnabled ? "var(--accent-muted)" : "var(--bg-base)",
                      border: clipboardEnabled ? "1px solid var(--accent)" : "1px solid var(--border)",
                      color: clipboardEnabled ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {t("onboarding.enable")}
                  </button>
                  <button
                    onClick={() => setClipboardEnabled(false)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: !clipboardEnabled ? "var(--accent-muted)" : "var(--bg-base)",
                      border: !clipboardEnabled ? "1px solid var(--accent)" : "1px solid var(--border)",
                      color: !clipboardEnabled ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {t("common.skip")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("onboarding.step", { current: step + 1, total: totalSteps })}
          </span>
          <button
            onClick={nextStep}
            className="px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            {step === totalSteps - 1 ? (
              <><Rocket size={16} /> {t("onboarding.letsGo")}</>
            ) : (
              <><span>{t("common.next")}</span> <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
