import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Clock, X, Calendar } from "lucide-react";

interface ScheduledTask {
  id: string;
  name: string;
  tool: string;
  target: string;
  schedule: "hourly" | "daily" | "weekly";
  enabled: boolean;
  lastRun: string;
  nextRun: string;
}

const TOOLS = [
  "ShadowScan", "URL Scanner", "Port Scanner", "DNS Lookup", "WHOIS",
  "SSL Checker", "IP Intelligence", "Email Breach", "Username Search",
  "CVE Search", "NightWatch", "Phishing Scanner",
];

const TOOL_ICONS: Record<string, string> = {
  shadowscan: "🔭", "url scanner": "🔗", "port scanner": "🔌",
  "dns lookup": "🌐", whois: "📋", "ssl checker": "🔒",
  "ip intelligence": "🌍", "email breach": "📧", "username search": "👤",
  "cve search": "🐛", nightwatch: "🌙", "phishing scanner": "🎣",
};

function getToolIcon(tool: string) {
  return TOOL_ICONS[tool.toLowerCase()] || "⚙️";
}

const SCHEDULE_COLORS: Record<string, string> = { hourly: "#0066FF", daily: "#00FF88", weekly: "#FFB800" };

function computeNextRun(schedule: string): string {
  const now = new Date();
  if (schedule === "hourly") now.setHours(now.getHours() + 1);
  else if (schedule === "daily") now.setDate(now.getDate() + 1);
  else now.setDate(now.getDate() + 7);
  return now.toISOString();
}

type FormState = { name: string; tool: string; target: string; schedule: "hourly" | "daily" | "weekly" };
const EMPTY_FORM: FormState = { name: "", tool: "ShadowScan", target: "", schedule: "daily" };

export default function Scheduler() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<ScheduledTask | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (typeof (mod as any).GetScheduledTasks === "function") {
        const result = await (mod as any).GetScheduledTasks();
        setTasks(result || []);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, []);

  const openAdd = () => {
    setEditTask(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (task: ScheduledTask) => {
    setEditTask(task);
    setForm({ name: task.name, tool: task.tool, target: task.target, schedule: task.schedule });
    setShowModal(true);
  };

  const saveTask = async () => {
    if (!form.name.trim() || !form.target.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const newTask: ScheduledTask = {
      id: editTask?.id || `task-${Date.now()}`,
      name: form.name.trim(),
      tool: form.tool,
      target: form.target.trim(),
      schedule: form.schedule as ScheduledTask["schedule"],
      enabled: editTask?.enabled ?? true,
      lastRun: editTask?.lastRun || "",
      nextRun: computeNextRun(form.schedule),
    };
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (editTask) {
        if (typeof (mod as any).UpdateScheduledTask === "function") {
          await (mod as any).UpdateScheduledTask(newTask);
        }
      } else {
        if (typeof (mod as any).AddScheduledTask === "function") {
          await (mod as any).AddScheduledTask(newTask);
        }
      }
    } catch {}
    if (editTask) {
      setTasks((prev) => prev.map((t) => t.id === editTask.id ? newTask : t));
    } else {
      setTasks((prev) => [...prev, newTask]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const deleteTask = async (id: string) => {
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (typeof (mod as any).RemoveScheduledTask === "function") {
        await (mod as any).RemoveScheduledTask(id);
      }
    } catch {}
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTask = async (task: ScheduledTask) => {
    const updated = { ...task, enabled: !task.enabled };
    try {
      const mod = await import("../../wailsjs/go/main/App");
      if (typeof (mod as any).ToggleScheduledTask === "function") {
        await (mod as any).ToggleScheduledTask(task.id, !task.enabled);
      }
    } catch {}
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>Scheduled Scans</h1>
          <p style={{ color: "var(--text-secondary)" }}>Automate recurring security scans on your targets</p>
        </div>
        <button onClick={openAdd}
          style={{ padding: "10px 18px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px" }}>
          <Plus size={16} /> Add New Task
        </button>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "80px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <Calendar size={48} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3, color: "var(--accent)" }} />
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No Scheduled Tasks</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "14px" }}>Create your first automated scan to get started</p>
          <button onClick={openAdd} style={{ padding: "10px 20px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
            Add First Task
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Task", "Tool", "Target", "Schedule", "Last Run", "Next Run", "Enabled", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}>{task.name}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "18px" }}>{getToolIcon(task.tool)}</span>
                    <span style={{ marginLeft: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>{task.tool}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "160px" }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.target}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", background: `${SCHEDULE_COLORS[task.schedule]}22`, color: SCHEDULE_COLORS[task.schedule] }}>
                      {task.schedule}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                    {task.lastRun ? new Date(task.lastRun).toLocaleString() : "Never"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                    {task.nextRun ? new Date(task.nextRun).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => toggleTask(task)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {task.enabled
                        ? <ToggleRight size={24} style={{ color: "var(--accent)" }} />
                        : <ToggleLeft size={24} style={{ color: "var(--text-muted)" }} />}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => openEdit(task)} style={{ padding: "6px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", cursor: "pointer" }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteTask(task.id)} style={{ padding: "6px", background: "rgba(255,51,68,0.1)", border: "1px solid rgba(255,51,68,0.3)", borderRadius: "6px", color: "#FF3344", cursor: "pointer" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700 }}>
                  {editTask ? "Edit Task" : "Add New Task"}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Task Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Daily scan of example.com" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Tool</label>
                  <select value={form.tool} onChange={(e) => setForm((f) => ({ ...f, tool: e.target.value }))} style={inputStyle}>
                    {TOOLS.map((t) => <option key={t} value={t}>{getToolIcon(t)} {t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Target (Domain / IP)</label>
                  <input value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} placeholder="e.g. example.com or 1.2.3.4" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Schedule</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["hourly", "daily", "weekly"] as const).map((s) => (
                      <button key={s} onClick={() => setForm((f) => ({ ...f, schedule: s }))}
                        style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${form.schedule === s ? SCHEDULE_COLORS[s] : "var(--border)"}`, background: form.schedule === s ? `${SCHEDULE_COLORS[s]}18` : "var(--bg-surface)", color: form.schedule === s ? SCHEDULE_COLORS[s] : "var(--text-secondary)", cursor: "pointer", fontSize: "13px", fontWeight: 600, textTransform: "capitalize" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                  <button onClick={saveTask} disabled={saving || !form.name.trim() || !form.target.trim()}
                    style={{ flex: 2, padding: "10px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving..." : editTask ? "Update Task" : "Add Task"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
