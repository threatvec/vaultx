import { useTranslation } from "react-i18next";
import { AlertTriangle, Download } from "lucide-react";

interface UpdateModalProps {
  version: string;
  onDownload: () => void;
}

export default function UpdateModal({ version, onDownload }: UpdateModalProps) {
  const { t } = useTranslation();

  return (
    <div className="update-overlay">
      <div className="update-modal">
        <div className="update-icon">
          <AlertTriangle size={48} />
        </div>
        <h2>{t("update.title")}</h2>
        <p>{t("update.message")}</p>
        <button className="update-btn" onClick={onDownload}>
          <Download size={18} />
          <span>{t("update.download", { version })}</span>
        </button>
      </div>
    </div>
  );
}
