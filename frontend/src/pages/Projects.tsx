import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, FolderOpen, Target, BarChart2, X, ChevronLeft, Globe } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  targets: string[];
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

const COLORS = ["#00FF88", "#0066FF", "#FF3344", "#FFB800", "#CC66FF", "#00CCFF"];

const getProjects = (): Project[] => {
  try { return JSON.parse(localStorage.getItem("vaultx_projects") || "[]"); } catch { return []; }
};
const saveProjects = (p: Project[]) => localStorage.setItem("vaultx_projects", JSON.stringify(p));

const EMPTY_FORM = { name: "", description: "", color: COLORS[0], targets: "" };

export default function Projects() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const mod = await import("../../wailsjs/go/main/App");
        if (typeof (mod as any).GetProjects === "function") {
          const result = await (mod as any).GetProjects();
          if (result && result.length > 0) { setProjects(result); return; }
        }
      } catch {}
      setProjects(getProjects());
    };
    load();
  }, []);

  const persist = (updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
    try {
      import("../../wailsjs/go/main/App").then((mod) => {
        if (typeof (mod as any).SaveProjects === "function") (mod as any).SaveProjects(updated);
      });
    } catch {}
  };

  const openAdd = () => {
    setEditProject(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (proj: Project) => {
    setEditProject(proj);
    setForm({ name: proj.name, description: proj.description, color: proj.color, targets: proj.targets.join("\n") });
    setShowModal(true);
  };

  const saveProject = () => {
    if (!form.name.trim()) return;
    const targets = form.targets.split("\n").map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString();
    if (editProject) {
      const updated = projects.map((p) => p.id === editProject.id
        ? { ...p, name: form.name.trim(), description: form.description.trim(), color: form.color, targets, updatedAt: now }
        : p);
      persist(updated);
      if (openProject?.id === editProject.id) setOpenProject({ ...openProject, name: form.name.trim(), description: form.description.trim(), color: form.color, targets, updatedAt: now });
    } else {
      const newProj: Project = { id: `proj-${Date.now()}`, name: form.name.trim(), description: form.description.trim(), color: form.color, targets, scanCount: 0, createdAt: now, updatedAt: now };
      persist([...projects, newProj]);
    }
    setShowModal(false);
  };

  const deleteProject = (id: string) => {
    persist(projects.filter((p) => p.id !== id));
    if (openProject?.id === id) setOpenProject(null);
    setDeleteConfirm(null);
  };

  const inputStyle = { width: "100%", padding: "9px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" as const };
  const labelStyle = { display: "block" as const, color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" };

  if (openProject) {
    const proj = projects.find((p) => p.id === openProject.id) || openProject;
    return (
      <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button onClick={() => setOpenProject(null)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginBottom: "20px", fontSize: "13px" }}>
            <ChevronLeft size={16} /> Back to Projects
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${proj.color}25`, border: `2px solid ${proj.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FolderOpen size={22} style={{ color: proj.color }} />
              </div>
              <div>
                <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>{proj.name}</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{proj.description || "No description"}</p>
              </div>
            </div>
            <button onClick={() => openEdit(proj)} style={{ padding: "8px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <Edit2 size={14} /> Edit Project
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <Target size={20} style={{ color: proj.color }} />
              <div><p style={{ color: "var(--text-muted)", fontSize: "11px" }}>TARGETS</p><p style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700 }}>{proj.targets.length}</p></div>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <BarChart2 size={20} style={{ color: proj.color }} />
              <div><p style={{ color: "var(--text-muted)", fontSize: "11px" }}>SCANS</p><p style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700 }}>{proj.scanCount}</p></div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe size={15} style={{ color: proj.color }} /> Targets
            </h3>
            {proj.targets.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No targets added yet. Edit the project to add targets.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {proj.targets.map((target, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: proj.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-primary)", fontSize: "13px", fontFamily: "monospace" }}>{target}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "16px" }}>
            Created {new Date(proj.createdAt).toLocaleString()} · Updated {new Date(proj.updatedAt).toLocaleString()}
          </p>
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
              onClick={() => setShowModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflowY: "auto" }}>
                <ProjectModalContent form={form} setForm={setForm} editProject={editProject} onSave={saveProject} onClose={() => setShowModal(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>Projects</h1>
          <p style={{ color: "var(--text-secondary)" }}>Organize your targets and scans into workspaces</p>
        </div>
        <button onClick={openAdd} style={{ padding: "10px 18px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px" }}>
          <Plus size={16} /> New Project
        </button>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "80px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <FolderOpen size={52} style={{ margin: "0 auto 16px", display: "block", opacity: 0.25 }} />
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No Projects Yet</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "14px" }}>Create a project to organize your security investigations</p>
          <button onClick={openAdd} style={{ padding: "10px 20px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
            Create First Project
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {projects.map((proj, i) => (
            <motion.div key={proj.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "6px", background: proj.color }} />
              <div style={{ padding: "18px 18px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700 }}>{proj.name}</h3>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => openEdit(proj)} style={{ padding: "5px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", cursor: "pointer" }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => setDeleteConfirm(proj.id)} style={{ padding: "5px", background: "rgba(255,51,68,0.08)", border: "1px solid rgba(255,51,68,0.2)", borderRadius: "6px", color: "#FF3344", cursor: "pointer" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "14px", minHeight: "18px" }}>{proj.description || "No description"}</p>
                <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Target size={13} style={{ color: "var(--text-muted)" }} />
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{proj.targets.length} targets</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <BarChart2 size={13} style={{ color: "var(--text-muted)" }} />
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{proj.scanCount} scans</span>
                  </div>
                </div>
                <button onClick={() => setOpenProject(proj)}
                  style={{ width: "100%", padding: "9px", background: `${proj.color}15`, border: `1px solid ${proj.color}40`, borderRadius: "8px", color: proj.color, cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <FolderOpen size={14} /> Open Project
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflowY: "auto" }}>
              <ProjectModalContent form={form} setForm={setForm} editProject={editProject} onSave={saveProject} onClose={() => setShowModal(false)} />
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "360px", textAlign: "center" }}>
              <Trash2 size={36} style={{ color: "#FF3344", margin: "0 auto 12px", display: "block" }} />
              <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Delete Project?</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                "{projects.find((p) => p.id === deleteConfirm)?.name}" and all its data will be deleted permanently.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => deleteProject(deleteConfirm)} style={{ flex: 1, padding: "10px", background: "#FF3344", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700 }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ModalProps {
  form: { name: string; description: string; color: string; targets: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; color: string; targets: string }>>;
  editProject: Project | null;
  onSave: () => void;
  onClose: () => void;
}

function ProjectModalContent({ form, setForm, editProject, onSave, onClose }: ModalProps) {
  const inputStyle = { width: "100%", padding: "9px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" as const };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700 }}>{editProject ? "Edit Project" : "New Project"}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Project Name *</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Client Recon Q2" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Description</label>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description..." style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "8px" }}>Color</label>
          <div style={{ display: "flex", gap: "10px" }}>
            {COLORS.map((c) => (
              <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: form.color === c ? `3px solid #fff` : "3px solid transparent", cursor: "pointer", padding: 0, transition: "border 0.15s" }} />
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>Targets (one per line)</label>
          <textarea value={form.targets} onChange={(e) => setForm((f) => ({ ...f, targets: e.target.value }))} placeholder={"example.com\n192.168.1.1\nsubdomain.target.com"} rows={5}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", lineHeight: "1.5" }} />
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
          <button onClick={onSave} disabled={!form.name.trim()}
            style={{ flex: 2, padding: "10px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#000", cursor: form.name.trim() ? "pointer" : "not-allowed", fontSize: "14px", fontWeight: 700, opacity: form.name.trim() ? 1 : 0.6 }}>
            {editProject ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </>
  );
}
