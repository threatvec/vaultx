import { motion } from "framer-motion";
import { Clock, Zap, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ComingSoonProps {
  pageName?: string;
  onBack?: () => void;
}

export default function ComingSoon({ pageName, onBack }: ComingSoonProps) {
  const { i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        {/* Animated icon */}
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--accent)12",
            border: "2px solid var(--accent)30",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock size={32} style={{ color: "var(--accent)" }} />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            padding: "4px 14px",
            borderRadius: 20,
            background: "var(--accent)15",
            border: "1px solid var(--accent)35",
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {isTr ? "Yakında" : "Coming Soon"}
        </motion.div>

        {/* Heading */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {pageName || (isTr ? "Bu Araç Geliyor" : "This Tool is Coming")}
          </h2>
          <p
            className="text-secondary"
            style={{ fontSize: 13, lineHeight: 1.7, marginTop: 10, marginBottom: 0 }}
          >
            {isTr
              ? "Bu araç üzerinde aktif olarak çalışıyoruz. Yakında kullanıma açılacak — takipte kal."
              : "We're actively working on this tool. It will be available soon — stay tuned."}
          </p>
        </div>

        {/* Feature hints */}
        <div
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 10,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textAlign: "left",
          }}
        >
          <Zap size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {isTr
              ? "Bu araç tam kapasitesiyle açıldığında buraya otomatik yönlendirileceksin."
              : "When this tool launches at full capacity, you'll be automatically redirected here."}
          </span>
        </div>

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-hover)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} />
            {isTr ? "Geri Dön" : "Go Back"}
          </button>
        )}
      </motion.div>
    </div>
  );
}
