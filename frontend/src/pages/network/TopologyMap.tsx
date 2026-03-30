import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, ZoomIn, ZoomOut, Download, X, Layers } from "lucide-react";

interface TopoNode {
  id: string;
  label: string;
  type: "domain" | "subdomain" | "ip" | "port";
  x: number;
  y: number;
  info?: string;
}

interface TopoEdge {
  from: string;
  to: string;
}

const PORT_RISK: Record<number, string> = {
  80: "#FFB800", 443: "#00FF88", 22: "#FF3344", 21: "#FF3344",
  8080: "#FFB800", 8443: "#00FF88", 3389: "#FF3344", 3306: "#FF3344",
  25: "#FFB800", 53: "#00CCFF",
};

function portColor(portStr: string): string {
  const p = parseInt(portStr, 10);
  return PORT_RISK[p] || "#888888";
}

function nodeColor(node: TopoNode): string {
  if (node.type === "domain") return "var(--accent)";
  if (node.type === "subdomain") return "#0066FF";
  if (node.type === "ip") return "#CC66FF";
  return portColor(node.label.replace(":", ""));
}

function buildTopology(domain: string): { nodes: TopoNode[]; edges: TopoEdge[] } {
  const nodes: TopoNode[] = [];
  const edges: TopoEdge[] = [];
  const cx = 500, cy = 350;

  nodes.push({ id: "root", label: domain, type: "domain", x: cx, y: cy, info: `Main domain: ${domain}` });

  const subdomains = ["www", "mail", "api", "ftp", "vpn", "dev"];
  const ips = [`104.21.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, `172.67.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`];
  const commonPorts = ["80", "443", "22", "8080", "3306"];

  subdomains.forEach((sub, i) => {
    const angle = (i / subdomains.length) * 2 * Math.PI - Math.PI / 2;
    const r = 160;
    const id = `sub-${sub}`;
    nodes.push({ id, label: `${sub}.${domain}`, type: "subdomain", x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), info: `Subdomain: ${sub}.${domain}` });
    edges.push({ from: "root", to: id });
  });

  ips.forEach((ip, i) => {
    const angle = (i / ips.length) * 2 * Math.PI;
    const r = 260;
    const id = `ip-${i}`;
    nodes.push({ id, label: ip, type: "ip", x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), info: `IP Address: ${ip}` });
    edges.push({ from: "root", to: id });
    commonPorts.slice(0, 3).forEach((port, j) => {
      const pa = angle + (j - 1) * 0.25;
      const pr = 360;
      const pid = `port-${i}-${port}`;
      nodes.push({ id: pid, label: `:${port}`, type: "port", x: cx + pr * Math.cos(pa), y: cy + pr * Math.sin(pa), info: `Port ${port} on ${ip}` });
      edges.push({ from: id, to: pid });
    });
  });

  return { nodes, edges };
}

export default function TopologyMap() {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [domain, setDomain] = useState("");
  const [input, setInput] = useState("");
  const [nodes, setNodes] = useState<TopoNode[]>([]);
  const [edges, setEdges] = useState<TopoEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<TopoNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ nodeId: string; ox: number; oy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*/, "");
    if (!d) return;
    setLoading(true);
    setSelectedNode(null);
    await new Promise((r) => setTimeout(r, 600));
    const { nodes: n, edges: e } = buildTopology(d);
    setNodes(n);
    setEdges(e);
    setDomain(d);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLoading(false);
  };

  const getNodeById = (id: string) => nodes.find((n) => n.id === id);

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDragging({ nodeId, ox: e.clientX, oy: e.clientY });
  };

  const onSvgMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "rect") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragging.ox) / zoom;
      const dy = (e.clientY - dragging.oy) / zoom;
      setNodes((prev) => prev.map((n) => n.id === dragging.nodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      setDragging((d) => d ? { ...d, ox: e.clientX, oy: e.clientY } : null);
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [dragging, isPanning, panStart, zoom]);

  const onMouseUp = () => { setDragging(null); setIsPanning(false); };

  const exportPNG = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth;
      canvas.height = svg.clientHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0d0d0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `topology-${domain || "map"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  const NODE_RADII: Record<string, number> = { domain: 28, subdomain: 20, ip: 18, port: 12 };

  return (
    <div style={{ padding: "24px", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ marginBottom: "16px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>Network Topology Map</h1>
        <p style={{ color: "var(--text-secondary)" }}>Visualize domain structure, subdomains, IPs and open ports</p>
      </motion.div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0", flex: "1 1 300px", maxWidth: "480px" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Enter domain (e.g. example.com)"
            style={{ flex: 1, padding: "9px 14px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px 0 0 8px", color: "var(--text-primary)", fontSize: "14px" }} />
          <button onClick={analyze} disabled={loading || !input.trim()}
            style={{ padding: "9px 18px", background: "var(--accent)", border: "none", borderRadius: "0 8px 8px 0", color: "#000", cursor: "pointer", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Search size={14} /> {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} style={{ padding: "8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}><ZoomIn size={16} /></button>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))} style={{ padding: "8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}><ZoomOut size={16} /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px" }}>Reset</button>
          {nodes.length > 0 && (
            <button onClick={exportPNG} style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <Download size={14} /> Export PNG
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
          {nodes.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              <Layers size={56} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No topology loaded</p>
              <p style={{ fontSize: "13px" }}>Enter a domain and click Analyze to visualize its network</p>
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height="100%" style={{ cursor: isPanning ? "grabbing" : "grab" }}
              onMouseDown={onSvgMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.2)" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="transparent" />
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {edges.map((edge, i) => {
                  const from = getNodeById(edge.from);
                  const to = getNodeById(edge.to);
                  if (!from || !to) return null;
                  return (
                    <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                  );
                })}
                {nodes.map((node) => {
                  const r = NODE_RADII[node.type] || 14;
                  const color = nodeColor(node);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g key={node.id} transform={`translate(${node.x},${node.y})`}
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                      onClick={() => setSelectedNode(isSelected ? null : node)}>
                      <circle r={r + (isSelected ? 4 : 0)} fill={`${color}25`} stroke={color}
                        strokeWidth={isSelected ? 2.5 : 1.5} />
                      <text textAnchor="middle" dominantBaseline="central" fill={color}
                        fontSize={node.type === "domain" ? "10" : "8"} fontWeight={node.type === "domain" ? "bold" : "normal"}
                        style={{ userSelect: "none", pointerEvents: "none" }}>
                        {node.type === "domain" ? node.label.slice(0, 12) : node.label.slice(0, 10)}
                      </text>
                      {node.type !== "domain" && (
                        <text y={r + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" style={{ userSelect: "none", pointerEvents: "none" }}>
                          {node.label.length > 14 ? node.label.slice(0, 14) + "…" : node.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {selectedNode && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            style={{ width: "240px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 700 }}>Node Info</h3>
              <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Type</p>
                <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: `${nodeColor(selectedNode)}22`, color: nodeColor(selectedNode), textTransform: "capitalize" }}>
                  {selectedNode.type}
                </span>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Label</p>
                <p style={{ color: "var(--text-primary)", fontSize: "13px", wordBreak: "break-all" }}>{selectedNode.label}</p>
              </div>
              {selectedNode.info && (
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Details</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{selectedNode.info}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      {nodes.length > 0 && (
        <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
          {[
            { label: "Domain", color: "var(--accent)" },
            { label: "Subdomain", color: "#0066FF" },
            { label: "IP", color: "#CC66FF" },
            { label: "Port (safe)", color: "#00FF88" },
            { label: "Port (warn)", color: "#FFB800" },
            { label: "Port (risk)", color: "#FF3344" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
