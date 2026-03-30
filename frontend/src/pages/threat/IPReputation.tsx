import { useState } from "react";
import { CheckIPReputation, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { threat } from "../../../wailsjs/go/models";

export default function IPReputation() {
  const [result, setResult] = useState<threat.IPReputationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await CheckIPReputation(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  const handleAI = async () => {
    if (!result) return;
    await QueryAI(`Analyze this IP reputation result and assess threat level:\n${JSON.stringify(result, null, 2)}`);
  };

  const getScoreClass = (score: number) => score >= 70 ? "high" : score >= 30 ? "medium" : "low";

  return (
    <ToolPage
      title="IP Reputation"
      description="Blacklist/abuse/botnet check, VPN/Proxy/Tor detection"
      placeholder="8.8.8.8"
      onQuery={handleQuery}
      loading={loading}
      toolName="ipreputation"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          <div className="result-card">
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div className="score-gauge">
                <div className={`score-circle ${getScoreClass(result.risk_score)}`}>
                  {result.risk_score}
                </div>
                <span className="text-secondary" style={{ fontSize: 12 }}>Risk Score</span>
              </div>
              <div className="result-grid" style={{ flex: 1 }}>
                {[
                  ["IP", result.ip],
                  ["Country", `${result.country} (${result.country_code})`],
                  ["ISP", result.isp],
                  ["Domain", result.domain],
                  ["Abuse Score", `${result.abuse_score}%`],
                  ["Total Reports", result.total_reports?.toString()],
                  ["Usage Type", result.usage_type],
                  ["Last Reported", result.last_reported_at],
                ].map(([label, value]) => (
                  <div key={label} className="result-row">
                    <span className="result-label">{label}</span>
                    <span className="result-value">{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="result-card">
            <p className="result-card-title">Threat Flags</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "VPN", value: result.is_vpn },
                { label: "Proxy", value: result.is_proxy },
                { label: "Tor", value: result.is_tor },
                { label: "Botnet", value: result.is_botnet },
                { label: "Data Center", value: result.is_datacenter },
              ].map(({ label, value }) => (
                <span key={label} className={`result-badge ${value ? "danger" : "success"}`}>
                  {label}: {value ? "Yes" : "No"}
                </span>
              ))}
            </div>
          </div>

          {result.blacklists?.length ? (
            <div className="result-card">
              <p className="result-card-title" style={{ color: "#FF3344" }}>
                Blacklisted ({result.blacklists.length})
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.blacklists.map((bl, i) => (
                  <span key={i} className="result-badge danger">{bl}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="result-card">
              <p className="result-card-title" style={{ color: "#00FF88" }}>Blacklists: Clean</p>
            </div>
          )}
        </>
      )}
    </ToolPage>
  );
}
