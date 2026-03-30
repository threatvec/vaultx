import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import tr from "./tr";

i18n.use(initReactI18next).init({
  resources: { en, tr },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Load saved language from backend on startup
(async () => {
  try {
    const { GetSettings } = await import("../../wailsjs/go/main/App");
    const settings = await GetSettings();
    if (settings?.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  } catch {
    // Backend not ready yet, keep default
  }
})();

export default i18n;
