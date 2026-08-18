import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScoreBreakdown } from "../../components/scoring/ScoreBreakdown";
import { CreatorScoreCard } from "../../components/scoring/CreatorScoreCard";
import { ShortlistPickerModal } from "../../components/shortlists/ShortlistPickerModal";
import {
  fetchCreator,
  fetchCreatorAnalysis,
  fetchCampaigns,
  addCreatorToCampaign,
} from "../../lib/apiClient";
import { formatFollowers, formatINR, formatPercent } from "../../lib/format";
import type { Creator, CreatorAnalysis, MatchBreakdown } from "../../types/creator";
import type { Campaign } from "../../types/campaign";

function isAllZero(values: MatchBreakdown): boolean {
  return Object.values(values).every((v) => !v);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Module-level, not component state: survives unmount/remount (navigating
// to a profile, away, and back doesn't re-spend Gemini quota on an
// identical request) and dedupes StrictMode's dev-mode double-mount into
// one real network call instead of two.
const analysisCache = new Map<string, Promise<CreatorAnalysis>>();

function loadAnalysisCached(id: string, force = false): Promise<CreatorAnalysis> {
  if (force || !analysisCache.has(id)) {
    const request = fetchCreatorAnalysis(id);
    analysisCache.set(id, request);
    request.catch(() => analysisCache.delete(id)); // don't cache a failure
  }
  return analysisCache.get(id)!;
}

// Member B — Creator Intelligence
export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId") ?? "";

  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<CreatorAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [shortlisted, setShortlisted] = useState(false);
  const [shortlistPickerOpen, setShortlistPickerOpen] = useState(false);

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [addedCampaignId, setAddedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchCreator(id, campaignId || undefined)
      .then(setCreator)
      .catch(() => setCreatorError("Could not load this creator. Check your connection and reload."));
  }, [id, campaignId]);

  // Powers the "Score against" select: campaigns are needed as soon as the
  // rail renders, not just when the add-to-campaign modal opens.
  useEffect(() => {
    fetchCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]));
  }, []);

  function handleScoreAgainstChange(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("campaignId", value);
        else next.delete("campaignId");
        return next;
      },
      { replace: true }
    );
  }

  async function loadAnalysis(ignore?: { current: boolean }, force = false) {
    if (!id) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const data = await loadAnalysisCached(id, force);
      if (!ignore?.current) setAnalysis(data);
    } catch {
      if (!ignore?.current) {
        setAnalysisError("Could not generate an analysis. Try regenerating — this call can occasionally time out.");
      }
    } finally {
      if (!ignore?.current) setAnalysisLoading(false);
    }
  }

  // Loads on mount, not behind a click — an empty card isn't a real state.
  // StrictMode double-invokes this effect in dev, firing two real API
  // calls; the ignore flag makes sure only the still-current one commits
  // to state, so a slower stale response can't clobber a fresher result.
  useEffect(() => {
    const ignore = { current: false };
    if (id) loadAnalysis(ignore);
    return () => {
      ignore.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleShortlist() {
    if (!id) return;
    setShortlistPickerOpen(true);
  }

  function openCampaignModal() {
    setCampaignModalOpen(true);
  }

  async function handleAddToCampaign(campaignId: string) {
    if (!id) return;
    await addCreatorToCampaign(campaignId, { creatorId: id });
    setAddedCampaignId(campaignId);
  }

  if (creatorError) {
    return <p className="py-6 text-sm text-caution">{creatorError}</p>;
  }

  if (!creator) {
    return (
      <div className="flex gap-6 py-6">
        <Skeleton className="h-96 w-80 shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 py-6">
      {/* Sticky rail */}
      <aside className="sticky top-6 h-fit w-80 shrink-0 space-y-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-teal-soft font-data text-sm font-semibold text-teal">
              {initials(creator.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{creator.name}</p>
              <p className="truncate text-sm text-ink-secondary">
                @{creator.username} · {creator.platform}
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-secondary">
            {creator.category}
            {creator.location ? ` · ${creator.location}` : ""}
          </p>
        </Card>

        <Card className="space-y-2">
          <Select
            label="Score against"
            value={campaignId}
            onChange={(e) => handleScoreAgainstChange(e.target.value)}
          >
            <option value="">Creator score (no campaign)</option>
            {campaigns?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          {campaignId && (
            <Link to={`/campaigns/${campaignId}`} className="text-xs font-medium text-teal hover:underline">
              View campaign →
            </Link>
          )}
        </Card>

        {campaignId && creator.matchBreakdown && !isAllZero(creator.matchBreakdown) ? (
          <ScoreBreakdown matchScore={creator.matchScore ?? 0} breakdown={creator.matchBreakdown} />
        ) : creator.creatorScoreBreakdown ? (
          <CreatorScoreCard creatorScore={creator.creatorScore ?? 0} breakdown={creator.creatorScoreBreakdown} />
        ) : (
          <EmptyState title="No score yet" description="Not enough data to compute a score for this creator." />
        )}

        <Card className="flex items-center justify-between">
          <span className="text-sm text-ink-secondary">Est. cost</span>
          <span className="font-data text-lg font-semibold tabular-nums text-ink">
            {formatINR(creator.estimatedCost)}
          </span>
        </Card>

        <div className="flex flex-col gap-2">
          <Button variant={shortlisted ? "secondary" : "primary"} onClick={handleShortlist} disabled={shortlisted}>
            {shortlisted ? "Added to shortlist" : "Add to shortlist"}
          </Button>
          <Button variant="outline" onClick={openCampaignModal}>
            Add to campaign
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1 space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-steel-500">AI analysis</p>
            {!analysisLoading && (
              <button
                onClick={() => loadAnalysis(undefined, true)}
                className="text-xs font-medium text-teal hover:underline"
              >
                Regenerate
              </button>
            )}
          </div>

          {analysisLoading && (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <p className="pt-1 text-xs text-steel-500">
                Generating a data-grounded analysis — this can take up to 20 seconds.
              </p>
            </div>
          )}

          {analysisError && !analysisLoading && (
            <p className="mt-3 text-sm text-caution">{analysisError}</p>
          )}

          {analysis && !analysisLoading && (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-ink">{analysis.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-match">Strengths</p>
                  <ul className="list-inside list-disc space-y-1 text-ink-secondary">
                    {analysis.strengths?.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-caution">Weaknesses</p>
                  <ul className="list-inside list-disc space-y-1 text-ink-secondary">
                    {analysis.weaknesses?.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </div>
              </div>
              <p className="border-t-[0.5px] border-border pt-3 font-medium text-teal">{analysis.recommendation}</p>
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Key metrics</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Followers" value={formatFollowers(creator.followers)} />
            <Metric label="Engagement" value={formatPercent(creator.engagementRate)} />
            <Metric label="Avg views" value={formatFollowers(creator.avgViews)} />
            <Metric label="Avg likes" value={creator.avgLikes != null ? formatFollowers(creator.avgLikes) : "—"} />
            <Metric
              label="Avg comments"
              value={creator.avgComments != null ? formatFollowers(creator.avgComments) : "—"}
            />
            <Metric
              label="Growth rate"
              value={creator.growthRate != null ? formatPercent(creator.growthRate, { signed: true }) : "—"}
            />
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Audience</p>
          <div className="grid gap-6 sm:grid-cols-3">
            <AudienceGroup
              title="Gender"
              rows={[
                { label: "Male", value: creator.audienceMale },
                { label: "Female", value: creator.audienceFemale },
              ]}
            />
            <AudienceGroup
              title="Age"
              rows={[
                { label: "18-24", value: creator.age18_24 },
                { label: "25-34", value: creator.age25_34 },
                { label: "35-44", value: creator.age35_44 },
                { label: "45+", value: creator.age45Plus },
              ]}
            />
            <AudienceGroup
              title="Country"
              rows={[
                { label: "India", value: creator.audienceIndia },
                { label: "USA", value: creator.audienceUSA },
                { label: "UAE", value: creator.audienceUAE },
                { label: "UK", value: creator.audienceUK },
                { label: "Other", value: creator.audienceOther },
              ]}
            />
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Engagement</p>
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Engagement rate" value={formatPercent(creator.engagementRate)} />
              <Metric label="Avg likes" value={creator.avgLikes != null ? formatFollowers(creator.avgLikes) : "—"} />
              <Metric
                label="Avg comments"
                value={creator.avgComments != null ? formatFollowers(creator.avgComments) : "—"}
              />
              <Metric label="Avg views" value={formatFollowers(creator.avgViews)} />
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Authenticity</p>
            <div className="flex items-center gap-6">
              <Metric label="Authenticity" value={String(creator.authenticityScore)} />
              <Metric
                label="Audience quality"
                value={creator.audienceQualityScore != null ? String(creator.audienceQualityScore) : "—"}
              />
            </div>
            <p className="mt-3 text-xs text-ink-secondary">
              Higher scores indicate a more authentic following and a higher-quality, less bot-heavy audience.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        title="Add to campaign"
        description={`Choose a campaign to add ${creator.name} to.`}
      >
        {campaigns === null && (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        {campaigns?.length === 0 && (
          <EmptyState
            title="No campaigns yet"
            description="Create a campaign to add this creator to it."
            action={
              <Link to="/campaigns/new" className="text-sm font-medium text-teal hover:underline">
                New campaign →
              </Link>
            }
          />
        )}
        {campaigns && campaigns.length > 0 && (
          <ul className="space-y-2">
            {campaigns.map((campaign) => (
              <li key={campaign._id}>
                <button
                  onClick={() => campaign._id && handleAddToCampaign(campaign._id)}
                  disabled={addedCampaignId === campaign._id}
                  className="flex w-full items-center justify-between rounded-control border-[0.5px] border-border px-3 py-2 text-left text-sm hover:bg-steel-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-ink">{campaign.name}</span>
                  <span className="text-xs text-steel-500">
                    {addedCampaignId === campaign._id ? "Added" : campaign.brand ?? "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ShortlistPickerModal
        open={shortlistPickerOpen}
        onOpenChange={setShortlistPickerOpen}
        creatorId={id ?? ""}
        creatorName={creator.name}
        onAdded={() => {
          setShortlisted(true);
          setShortlistPickerOpen(false);
        }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-data text-base font-medium tabular-nums text-ink">{value}</p>
      <p className="text-xs text-ink-secondary">{label}</p>
    </div>
  );
}

function AudienceGroup({ title, rows }: { title: string; rows: { label: string; value?: number }[] }) {
  const withValues = rows.map((r) => ({ ...r, value: r.value ?? 0 }));
  const max = Math.max(...withValues.map((r) => r.value));

  return (
    <div className="max-w-[320px]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-500">{title}</p>
      <div className="space-y-1.5">
        {withValues.map((row) => {
          const isDominant = row.value === max && max > 0;
          return (
            <div key={row.label} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 text-ink-secondary">{row.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-pill bg-steel-100">
                <div
                  className={`h-full rounded-pill ${isDominant ? "bg-teal" : "bg-steel-300"}`}
                  style={{ width: `${row.value}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right font-data tabular-nums text-ink">{Math.round(row.value)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
