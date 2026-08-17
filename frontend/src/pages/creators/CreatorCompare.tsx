import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { fetchCreator } from "../../lib/apiClient";
import { formatFollowers, formatINR, formatPercent } from "../../lib/format";
import type { Creator } from "../../types/creator";

const DISCOVER_STORAGE_KEY = "discover-state";

// Clears the persisted selection on Discover too — otherwise navigating
// back still shows the "N creators selected" banner with the same ids.
function clearDiscoverSelection() {
  try {
    const raw = sessionStorage.getItem(DISCOVER_STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    state.selectedIds = [];
    sessionStorage.setItem(DISCOVER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable or malformed — nothing to clear
  }
}

interface MetricRow {
  key: string;
  label: string;
  value: (c: Creator) => number;
  format: (c: Creator) => string;
  higherIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  { key: "followers", label: "Followers", value: (c) => c.followers, format: (c) => formatFollowers(c.followers), higherIsBetter: true },
  { key: "engagement", label: "Engagement", value: (c) => c.engagementRate, format: (c) => formatPercent(c.engagementRate), higherIsBetter: true },
  { key: "avgViews", label: "Avg views", value: (c) => c.avgViews, format: (c) => formatFollowers(c.avgViews), higherIsBetter: true },
  { key: "authenticity", label: "Authenticity", value: (c) => c.authenticityScore, format: (c) => String(c.authenticityScore), higherIsBetter: true },
  { key: "estCost", label: "Est. cost", value: (c) => c.estimatedCost, format: (c) => formatINR(c.estimatedCost), higherIsBetter: false },
  {
    key: "costPer1k",
    label: "Cost per 1K",
    value: (c) => c.estimatedCost / (c.followers / 1000),
    format: (c) => formatINR(c.estimatedCost / (c.followers / 1000)),
    higherIsBetter: false,
  },
];

function headlineScore(c: Creator): number {
  return Math.round(c.matchScore ?? c.creatorScore ?? 0);
}

// Only a clean 2-way "reach vs. engagement" tradeoff reads as a real
// recommendation — with 3-4 creators, a single narrative would oversimplify.
function buildRecommendation(creators: Creator[]): string | null {
  if (creators.length !== 2) return null;
  const [a, b] = creators;
  const costPer1k = (c: Creator) => c.estimatedCost / (c.followers / 1000);
  const reachWinner = a.avgViews >= b.avgViews ? a : b;
  const reachLoser = reachWinner === a ? b : a;
  const engagementWinner = a.engagementRate >= b.engagementRate ? a : b;

  if (reachWinner === engagementWinner) {
    return `${reachWinner.name} leads on both reach (${formatFollowers(reachWinner.avgViews)} avg views) and engagement (${formatPercent(reachWinner.engagementRate)}) — the clearer pick here.`;
  }

  return `${reachWinner.name} for reach — ${formatFollowers(reachWinner.avgViews)} average views at ${formatINR(costPer1k(reachWinner))} per thousand. ${engagementWinner.name} engages better but ${formatFollowers(reachLoser.avgViews)} views won't carry a launch.`;
}

// Member B — Creator Intelligence
export default function CreatorCompare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 4);

  function clearComparison() {
    clearDiscoverSelection();
    navigate("/creators");
  }

  function removeFromComparison(id: string) {
    const remaining = ids.filter((existing) => existing !== id);
    if (remaining.length < 2) {
      clearComparison();
      return;
    }
    navigate(`/creators/compare?ids=${remaining.join(",")}`);
  }

  const [creators, setCreators] = useState<Creator[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      setCreators([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(ids.map((id) => fetchCreator(id)))
      .then(setCreators)
      .catch(() => setError("Could not load one or more creators."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  const recommendation = buildRecommendation(creators);

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Compare Creators</h1>
        {ids.length > 0 && (
          <button
            type="button"
            onClick={clearComparison}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
          >
            <ArrowLeft size={14} /> Back to Discover
          </button>
        )}
      </div>

      {ids.length < 2 && (
        <Card>
          <p className="text-sm text-ink-secondary">
            Select 2-4 creators from Discover to compare Followers, Engagement, Avg Views,
            Authenticity, Est. Cost, and Cost per 1K.
          </p>
        </Card>
      )}

      {loading && <p className="text-sm text-ink-secondary">Loading creators...</p>}
      {error && <p className="text-sm text-caution">{error}</p>}

      {creators.length > 0 && (
        <div className="space-y-6 overflow-x-auto">
        <div className="space-y-6" style={{ minWidth: creators.length * 180 }}>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${creators.length}, minmax(160px, 1fr))` }}
          >
            {creators.map((c) => (
              <Card key={c._id} className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar src={c.profileImage} name={c.name} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{c.name}</p>
                    <p className="truncate text-xs text-ink-secondary">
                      {c.platform}
                      {c.location ? ` · ${c.location.split(",")[0]}` : ""}
                    </p>
                    <p className="mt-1 font-data text-2xl font-semibold tabular-nums text-success">
                      {headlineScore(c)}
                      <span className="ml-1 text-xs font-normal text-ink-secondary">match</span>
                    </p>
                  </div>
                </div>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button type="button" aria-label="More options" className="text-steel-500 hover:text-ink">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onSelect={() => removeFromComparison(c._id)}>
                      Remove from comparison
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Card>
            ))}
          </div>

          <Card className="space-y-5">
            {METRIC_ROWS.map((row) => {
              const values = creators.map((c) => row.value(c));
              const max = Math.max(...values, 1);
              const best = row.higherIsBetter ? Math.max(...values) : Math.min(...values);
              return (
                <div key={row.key}>
                  <p className="mb-2 text-sm text-ink-secondary">{row.label}</p>
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${creators.length}, minmax(160px, 1fr))` }}
                  >
                    {creators.map((c, i) => {
                      const isWinner = values[i] === best;
                      return (
                        <div key={c._id}>
                          <p
                            className={`font-data text-sm font-medium tabular-nums ${isWinner ? "text-success" : "text-ink"}`}
                          >
                            {row.format(c)}
                          </p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-steel-100">
                            <div
                              className={`h-full rounded-pill ${isWinner ? "bg-success" : "bg-steel-300"}`}
                              style={{ width: `${Math.max(4, (values[i] / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
        </div>
      )}

      {creators.length > 0 && recommendation && (
        <div className="rounded-card border border-blue-soft bg-blue-soft p-4 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue">Recommendation</p>
          <p className="text-ink">{recommendation}</p>
        </div>
      )}
    </div>
  );
}
