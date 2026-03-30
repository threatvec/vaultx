import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { Download, Copy, Share2 } from "lucide-react";

interface ShareCardProps {
  title: string;
  score?: number;
  data: Record<string, string>;
  variant?: "success" | "warning" | "danger" | "info";
}

export default function ShareCard({ title, score, data, variant = "info" }: ShareCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `vaultx-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate card image:", err);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (err) {
      console.error("Failed to copy card:", err);
    }
  };

  const variantColors: Record<string, string> = {
    success: "#00FF88",
    warning: "#FFB800",
    danger: "#FF3344",
    info: "#0066FF",
  };

  return (
    <div className="share-card-wrapper">
      <div ref={cardRef} className="share-card" style={{ borderColor: variantColors[variant] }}>
        <div className="share-card-header">
          <span className="share-card-logo">VAULTX</span>
          {score !== undefined && (
            <span className="share-card-score" style={{ color: variantColors[variant] }}>
              {score}/100
            </span>
          )}
        </div>
        <h3 className="share-card-title">{title}</h3>
        <div className="share-card-data">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="share-card-row">
              <span className="share-card-label">{key}</span>
              <span className="share-card-value">{value}</span>
            </div>
          ))}
        </div>
        <div className="share-card-footer">
          <span>{t("app.name")} — {t("app.madeBy")}</span>
        </div>
      </div>

      <div className="share-card-actions">
        <button onClick={handleDownload} title={t("common.export")}>
          <Download size={16} />
        </button>
        <button onClick={handleCopy} title={t("common.copy")}>
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}
