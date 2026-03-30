import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard, X, ArrowRight } from "lucide-react";
import { EventsOn } from "../../wailsjs/runtime/runtime";

interface ClipboardDetection {
  type: string;
  content: string;
}

interface ClipboardToastProps {
  onNavigate: (page: string, query?: string) => void;
}

const typeToPage: Record<string, string> = {
  ip: "ip-intelligence",
  url: "url-scanner",
  email: "email-breach",
  hash: "hash-lookup",
};

export default function ClipboardToast({ onNavigate }: ClipboardToastProps) {
  const { t } = useTranslation();
  const [detection, setDetection] = useState<ClipboardDetection | null>(null);

  useEffect(() => {
    const cancel = EventsOn("clipboard:detected", (data: ClipboardDetection) => {
      setDetection(data);
      setTimeout(() => setDetection(null), 8000);
    });
    return () => cancel();
  }, []);

  const getMessage = (type: string): string => {
    const messages: Record<string, string> = {
      ip: t("clipboard.ipDetected"),
      url: t("clipboard.urlDetected"),
      email: t("clipboard.emailDetected"),
      hash: t("clipboard.hashDetected"),
    };
    return messages[type] || "";
  };

  const handleAction = () => {
    if (detection) {
      const page = typeToPage[detection.type];
      if (page) {
        onNavigate(page, detection.content);
      }
      setDetection(null);
    }
  };

  return (
    <AnimatePresence>
      {detection && (
        <motion.div
          className="clipboard-toast"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="clipboard-toast-content">
            <Clipboard size={18} />
            <div className="clipboard-toast-text">
              <p>{getMessage(detection.type)}</p>
              <code>{detection.content.substring(0, 40)}</code>
            </div>
          </div>
          <div className="clipboard-toast-actions">
            <button className="clipboard-toast-action" onClick={handleAction}>
              <ArrowRight size={14} />
            </button>
            <button className="clipboard-toast-dismiss" onClick={() => setDetection(null)}>
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
