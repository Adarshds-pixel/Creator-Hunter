import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ScoreGauge } from "../../components/creators/ScoreGauge";
import { fetchCreatorAnalysis } from "../../lib/apiClient";
import type { CreatorAnalysis } from "../../types/creator";

const TABS = ["Overview", "Audience", "Engagement", "Authenticity", "AI Analysis"] as const;
type Tab = (typeof TABS)[number];

// Member B — Creator Intelligence
// Note: GET /api/creators/:id is owned by Developer 2 and not implemented yet,
// so creator details aren't loaded here — only the AI Analysis tab (which reads
// the creator directly via the AI route) is wired to a real backend call.
export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [analysis, setAnalysis] = useState<CreatorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalysis() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCreatorAnalysis(id);
      setAnalysis(data);
    } catch {
      setError("Could not generate analysis yet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Creator Profile</h1>

      <div className="flex gap-4 border-b border-gray-200 text-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 font-medium text-indigo-600"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <Card>
          <p className="text-sm text-gray-500">
            Overview metrics load once Developer 2's Creator API is available.
          </p>
        </Card>
      )}

      {activeTab === "Audience" && (
        <Card>
          <p className="text-sm text-gray-500">Audience breakdown chart placeholder.</p>
        </Card>
      )}

      {activeTab === "Engagement" && (
        <Card>
          <p className="text-sm text-gray-500">Engagement metrics chart placeholder.</p>
        </Card>
      )}

      {activeTab === "Authenticity" && (
        <Card className="flex items-center gap-6">
          <ScoreGauge label="Authenticity" value="--" />
          <p className="text-sm text-gray-500">
            Authenticity score renders once creator data is available.
          </p>
        </Card>
      )}

      {activeTab === "AI Analysis" && (
        <Card className="space-y-4">
          <Button onClick={loadAnalysis} disabled={loading}>
            {loading ? "Analyzing..." : "Why is this creator a good fit?"}
          </Button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {analysis && (
            <div className="space-y-3 text-sm">
              <p className="text-gray-900">{analysis.summary}</p>
              <div>
                <p className="font-medium text-gray-900">Strengths</p>
                <ul className="list-inside list-disc text-gray-600">
                  {analysis.strengths?.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Weaknesses</p>
                <ul className="list-inside list-disc text-gray-600">
                  {analysis.weaknesses?.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
              <p className="font-medium text-indigo-600">{analysis.recommendation}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
