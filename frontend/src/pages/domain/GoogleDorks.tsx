import { useState } from "react";
import { GenerateDorks } from "../../../wailsjs/go/main/App";
import ToolPage from "../../components/ToolPage";
import type { domain } from "../../../wailsjs/go/models";

export default function GoogleDorks() {
  const [result, setResult] = useState<domain.DorkCategory[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (input: string) => {
    setLoading(true);
    try {
      const r = await GenerateDorks(input);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = result.map((cat) => `# ${cat.name}\n${cat.dorks.join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <ToolPage
      title="Google Dorks"
      description="Auto-generated dork queries for 30+ categories"
      placeholder="example.com"
      onQuery={handleQuery}
      loading={loading}
      toolName="dorks"
      hasResult={!!result}
      onCopy={handleCopy}
    >
      {result && (
        <>
          {result.map((cat, i) => (
            <div key={i} className="result-card">
              <p className="result-card-title">{cat.name}</p>
              {cat.dorks.map((dork, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <code className="result-value" style={{ flex: 1, fontSize: 12 }}>{dork}</code>
                  <button
                    className="tool-action-btn"
                    style={{ padding: "4px 12px", flexShrink: 0 }}
                    onClick={() => navigator.clipboard.writeText(dork)}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </ToolPage>
  );
}
