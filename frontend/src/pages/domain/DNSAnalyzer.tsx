import { useState } from "react";
import { motion } from "framer-motion";
import { LookupDNS, QueryAI } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function DNSAnalyzer() {
  const [result, setResult] = useState<domain.DNSResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await LookupDNS(input);
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
    const prompt = `Analyze this DNS configuration for ${result.domain} and identify security issues:\n${JSON.stringify(result, null, 2)}`;
    await QueryAI(prompt);
  };

  const renderResult = () => {
    if (!result) return null;
    const sections = [
      { label: "A Records", items: result.a },
      { label: "AAAA Records", items: result.aaaa },
      { label: "MX Records", items: result.mx },
      { label: "NS Records", items: result.ns },
      { label: "TXT Records", items: result.txt },
      { label: "CNAME Records", items: result.cname },
    ];

    return (
      <>
        <div className="result-card">
          <div className="result-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <span className={`result-badge ${result.spf ? "success" : "danger"}`}>
              {result.spf ? "SPF ✓" : "No SPF"}
            </span>
            <span className={`result-badge ${result.dmarc ? "success" : "danger"}`}>
              {result.dmarc ? "DMARC ✓" : "No DMARC"}
            </span>
            <span className={`result-badge ${result.has_dkim ? "success" : "danger"}`}>
              {result.has_dkim ? "DKIM ✓" : "No DKIM"}
            </span>
          </div>
        </div>

        {sections.map(({ label, items }) =>
          items?.length ? (
            <div key={label} className="result-card">
              <p className="result-card-title">{label}</p>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r: any, i: number) => (
                    <tr key={i}>
                      <td style={{ color: "var(--accent)" }}>{r.type}</td>
                      <td>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null
        )}

        {result.spf && (
          <div className="result-card">
            <p className="result-card-title">SPF Record</p>
            <code className="result-value">{result.spf}</code>
          </div>
        )}
        {result.dmarc && (
          <div className="result-card">
            <p className="result-card-title">DMARC Record</p>
            <code className="result-value">{result.dmarc}</code>
          </div>
        )}
      </>
    );
  };

  return (
    <ToolPage
      title="DNS Analyzer"
      description="A/AAAA/MX/NS/TXT/CNAME/SOA records + SPF/DMARC/DKIM analysis"
      placeholder="example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="dns"
      hasResult={!!result}
      onCopy={handleCopy}
      onAIAnalyze={handleAI}
    >
      {renderResult()}
    </ToolPage>
  );
}
