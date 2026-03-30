import { useState } from "react";
import { LookupBGP, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { network } from "../../../wailsjs/go/models";

export default function BGPLookup() {
  const [result, setResult] = useState<network.BGPResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await LookupBGP(input);
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
    await QueryAI(`Analyze this BGP/ASN data:\n${JSON.stringify(result, null, 2)}`);
  };

  return (
    <ToolPage
      title="BGP Lookup"
      description="BGP routing, ASN info, prefix list and peer relationships"
      placeholder="AS15169 or 8.8.8.8"
      onQuery={handleQuery}
      loading={loading}
      toolName="bgplookup"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {result && (
        <>
          {result.error ? (
            <div className="result-card">
              <p style={{ color: "#FF3344" }}>{result.error}</p>
            </div>
          ) : (
            <>
              <div className="result-card">
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
                    {result.asn}
                  </span>
                  {result.as_name && (
                    <span style={{ fontSize: 15, color: "var(--text-secondary)", marginLeft: 12 }}>{result.as_name}</span>
                  )}
                </div>
                <div className="result-grid">
                  {[
                    ["Description", result.as_description],
                    ["Country", result.country],
                    ["Allocated", result.allocated],
                    ["IPv4 Prefixes", result.prefix_count?.toString()],
                    ["Query", result.query],
                  ].map(([label, value]) =>
                    value ? (
                      <div key={label} className="result-row">
                        <span className="result-label">{label}</span>
                        <span className="result-value">{value}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {result.prefixes?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title">IPv4 Prefixes ({result.prefixes.length})</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.prefixes.slice(0, 50).map((p, i) => (
                      <code key={i} style={{ fontSize: 12, padding: "2px 8px", background: "var(--bg-hover)", borderRadius: 4, border: "1px solid var(--border)" }}>
                        {p}
                      </code>
                    ))}
                    {result.prefixes.length > 50 && (
                      <span className="text-muted" style={{ fontSize: 12, padding: "2px 8px" }}>
                        +{result.prefixes.length - 50} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {result.ipv6_prefixes?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title">IPv6 Prefixes ({result.ipv6_prefixes.length})</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.ipv6_prefixes.slice(0, 20).map((p, i) => (
                      <code key={i} style={{ fontSize: 12, padding: "2px 8px", background: "var(--bg-hover)", borderRadius: 4, border: "1px solid var(--border)" }}>
                        {p}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {result.peers?.length > 0 && (
                <div className="result-card">
                  <p className="result-card-title">BGP Peers ({result.peers.length})</p>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>ASN</th>
                        <th>Name</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.peers.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>{p.asn}</td>
                          <td>{p.name || "—"}</td>
                          <td>{p.country || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </ToolPage>
  );
}
