import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ScoreGauge } from "../../components/creators/ScoreGauge";
import { fetchCreator, fetchCreatorAnalysis, addCreatorToDefaultShortlist } from "../../lib/apiClient";
import type { Creator, CreatorAnalysis } from "../../types/creator";

const TABS = ["Overview", "Audience", "Engagement", "Authenticity", "AI Analysis"] as const;
type Tab = (typeof TABS)[number];

// Member B — Creator Intelligence
export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CreatorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCreator(id)
      .then(setCreator)
      .catch(() => setCreatorError("Could not load this creator."));
  }, [id]);

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

  async function handleShortlist() {
    if (!id) return;
    try {
      await addCreatorToDefaultShortlist(id);
      setShortlisted(true);
    } catch {
      setCreatorError("Could not add to shortlist.");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{creator?.name ?? "Creator Profile"}</h1>
          {creator && (
            <p className="text-sm text-gray-500">
              @{creator.username} · {creator.platform} · {creator.category}
            </p>
          )}
        </div>
        {creator && (
          <Button variant="outline" onClick={handleShortlist} disabled={shortlisted}>
            {shortlisted ? "Shortlisted" : "Add to shortlist"}
          </Button>
        )}
      </div>

      {creatorError && <p className="text-sm text-red-600">{creatorError}</p>}

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
        <Card className="space-y-3">
          {creator ? (
            <>
              <p className="text-sm text-gray-700">{creator.bio ?? "No bio available."}</p>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Location" value={creator.location ?? "—"} />
                <Stat label="Followers" value={creator.followers.toLocaleString()} />
                <Stat label="Following" value={creator.following?.toLocaleString() ?? "—"} />
                <Stat label="Posts" value={creator.posts?.toLocaleString() ?? "—"} />
                <Stat label="Est. cost" value={`₹${creator.estimatedCost.toLocaleString()}`} />
                <Stat
                  label="Growth rate"
                  value={creator.growthRate != null ? `${creator.growthRate}%` : "—"}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading creator...</p>
          )}
        </Card>
      )}

      {activeTab === "Audience" && (
        <Card className="space-y-4">
          {creator ? (
            <>
              <div>
                <p className="mb-1 text-sm font-medium text-gray-900">Gender</p>
                <BarRow label="Male" value={creator.audienceMale} />
                <BarRow label="Female" value={creator.audienceFemale} />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-gray-900">Age</p>
                <BarRow label="18-24" value={creator.age18_24} />
                <BarRow label="25-34" value={creator.age25_34} />
                <BarRow label="35-44" value={creator.age35_44} />
                <BarRow label="45+" value={creator.age45Plus} />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-gray-900">Country</p>
                <BarRow label="India" value={creator.audienceIndia} />
                <BarRow label="USA" value={creator.audienceUSA} />
                <BarRow label="UAE" value={creator.audienceUAE} />
                <BarRow label="UK" value={creator.audienceUK} />
                <BarRow label="Other" value={creator.audienceOther} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading audience data...</p>
          )}
        </Card>
      )}

      {activeTab === "Engagement" && (
        <Card>
          {creator ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ScoreGauge label="Engagement" value={`${creator.engagementRate}%`} />
              <Stat label="Avg likes" value={creator.avgLikes?.toLocaleString() ?? "—"} />
              <Stat label="Avg comments" value={creator.avgComments?.toLocaleString() ?? "—"} />
              <Stat label="Avg views" value={creator.avgViews.toLocaleString()} />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading engagement metrics...</p>
          )}
        </Card>
      )}

      {activeTab === "Authenticity" && (
        <Card className="flex items-center gap-6">
          <ScoreGauge label="Authenticity" value={creator?.authenticityScore ?? "--"} />
          <ScoreGauge label="Audience quality" value={creator?.audienceQualityScore ?? "--"} />
          <p className="text-sm text-gray-500">
            Higher scores indicate a more authentic, higher-quality audience.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-gray-900">{value}</p>
      <p className="text-gray-500">{label}</p>
    </div>
  );
}

function BarRow({ label, value }: { label: string; value?: number }) {
  const pct = value ?? 0;
  return (
    <div className="mb-1 flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-gray-500">{pct}%</span>
    </div>
  );
}
