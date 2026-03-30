import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Plus, Trash2, AlertTriangle, Mail, Globe, Wifi, User, Loader2 } from "lucide-react";
import {
  GetWatchTargets,
  AddWatchTarget,
  RemoveWatchTarget,
  SaveSetting,
  GetSettings,
} from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import type { threat } from "../../../wailsjs/go/models";

const TYPE_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  domain: Globe,
  ip: Wifi,
  username: User,
};

interface AlertEntry {
  target: string;
  title: string;
  source: string;
  detected_at: string;
}

export default function NightWatch() {
  const [targets, setTargets] = useState<threat.WatchTarget[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [addType, setAddType] = useState("email");
  const [addValue, setAddValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    loadTargets();
    loadSettings();
    const cancel = EventsOn("nightwatch:alert", (data: AlertEntry) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
    });
    return () => cancel();
  }, []);

  const loadTargets = async () => {
    try {
      const t = await GetWatchTargets();
      setTargets(t || []);
    } catch {}
  };

  const loadSettings = async () => {
    try {
      const s = await GetSettings();
      setDiscordWebhook(s["discord_webhook"] || "");
    } catch {}
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValue.trim()) return;
    setAdding(true);
    try {
      await AddWatchTarget(addType, addValue.trim());
      setAddValue("");
      await loadTargets();
    } catch {}
    finally { setAdding(false); }
  };

  const handleRemove = async (value: string) => {
    try {
      await RemoveWatchTarget(value);
      await loadTargets();
    } catch {}
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      await SaveSetting("discord_webhook", discordWebhook);
    } catch {}
    finally { setSavingWebhook(false); }
  };

  const getRiskClass = (score: number) => {
    if (score >= 70) return "danger";
    if (score >= 40) return "warning";
    return "success";
  };

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>NightWatch</h1>
        <p className="text-secondary">24/7 breach monitoring — email, domain, IP, username</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        {/* Add Target */}
        <div className="result-card">
          <p className="result-card-title">
            <Plus size={16} />
            Add Monitor Target
          </p>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["email", "domain", "ip", "username"].map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    className={`tool-action-btn ${addType === t ? "accent" : ""}`}
                    onClick={() => setAddType(t)}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Icon size={14} />
                    <span style={{ textTransform: "capitalize" }}>{t}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder={addType === "email" ? "user@example.com" : addType === "domain" ? "example.com" : ""}
                className="tool-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="tool-scan-btn" disabled={adding || !addValue.trim()}>
                {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>
          </form>
        </div>

        {/* Discord Webhook */}
        <div className="result-card">
          <p className="result-card-title">Discord Webhook</p>
          <p className="text-secondary" style={{ fontSize: 13, marginBottom: 12 }}>
            Get notified in Discord when a breach is found
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="tool-input"
              style={{ flex: 1 }}
            />
            <button className="tool-scan-btn" onClick={handleSaveWebhook} disabled={savingWebhook}>
              {savingWebhook ? <Loader2 size={16} className="animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Monitored Targets */}
      <div className="result-card" style={{ marginTop: 20 }}>
        <p className="result-card-title">
          <Eye size={16} />
          Monitored Targets ({targets.length})
        </p>
        {targets.length === 0 ? (
          <p className="text-muted" style={{ padding: "16px 0" }}>No targets added yet</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {targets.map((t, i) => {
              const Icon = TYPE_ICONS[t.type] || Mail;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="result-card"
                  style={{ margin: 0 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Icon size={18} style={{ color: "var(--accent)" }} />
                      <div>
                        <div style={{ fontFamily: "monospace", fontSize: 13 }}>{t.value}</div>
                        <span className={`result-badge ${getRiskClass(t.risk_score)}`} style={{ marginTop: 4 }}>
                          Risk: {t.risk_score}
                        </span>
                      </div>
                    </div>
                    <button
                      className="tool-action-btn"
                      style={{ padding: "4px 8px" }}
                      onClick={() => handleRemove(t.value)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                    Last check: {t.last_check ? new Date(t.last_check).toLocaleString() : "Never"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Feed */}
      {alerts.length > 0 && (
        <div className="result-card" style={{ marginTop: 20 }}>
          <p className="result-card-title">
            <AlertTriangle size={16} style={{ color: "#FF3344" }} />
            Live Alerts
          </p>
          <AnimatePresence>
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <AlertTriangle size={16} style={{ color: "#FF3344", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{alert.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {alert.target} — {alert.source}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {alert.detected_at ? new Date(alert.detected_at).toLocaleString() : ""}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
