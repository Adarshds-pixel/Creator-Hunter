import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { OutreachPanel } from "../../components/outreach/OutreachPanel";
import {
  fetchCampaign,
  fetchCreators,
  addCreatorToCampaign,
  updateCampaignCreator,
  type CampaignDetailResponse,
} from "../../lib/apiClient";
import type { CampaignCreator, CampaignCreatorStatus } from "../../types/campaignCreator";
import type { Creator } from "../../types/creator";

const PIPELINE_STAGES: CampaignCreatorStatus[] = [
  "DISCOVERED",
  "SHORTLISTED",
  "CONTACTED",
  "REPLIED",
  "NEGOTIATING",
  "APPROVED",
  "CONTENT_SUBMITTED",
  "COMPLETED",
];

function nextStage(stage: CampaignCreatorStatus): CampaignCreatorStatus {
  const idx = PIPELINE_STAGES.indexOf(stage);
  return PIPELINE_STAGES[Math.min(idx + 1, PIPELINE_STAGES.length - 1)];
}

// Member C — Campaigns & Outreach
export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Creator[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeOutreachCreatorId, setActiveOutreachCreatorId] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      const data = await fetchCampaign(id);
      setCampaign(data);
    } catch {
      setError("Could not load this campaign.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddSearch() {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const { creators } = await fetchCreators({ category: searchTerm.trim() });
      setSearchResults(creators);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddCreator(creator: Creator) {
    if (!id) return;
    await addCreatorToCampaign(id, {
      creatorId: creator._id,
      matchScore: creator.matchScore,
    });
    await load();
  }

  async function handleAdvance(cc: CampaignCreator, status: CampaignCreatorStatus) {
    if (!id) return;
    await updateCampaignCreator(id, cc.creatorId, { status });
    await load();
  }

  if (error) return <p className="p-6 text-sm text-caution">{error}</p>;
  if (!campaign) return <p className="p-6 text-sm text-ink-secondary">Loading campaign...</p>;

  const grouped = new Map<string, CampaignCreator[]>();
  for (const stage of PIPELINE_STAGES) grouped.set(stage, []);
  for (const cc of campaign.creators) {
    if (!grouped.has(cc.status)) continue;
    grouped.get(cc.status)!.push(cc);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{campaign.name}</h1>
        <p className="text-sm text-ink-secondary">
          {campaign.brand ?? "—"} · {campaign.status ?? "DRAFT"} · Budget ₹
          {campaign.budget?.toLocaleString() ?? "—"}
        </p>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-ink">Add creators to this campaign</p>
        <div className="flex gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Category, e.g. Fitness"
            className="flex-1 rounded-md border-[0.5px] border-border bg-surface px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
          />
          <Button onClick={handleAddSearch} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((creator) => (
              <div
                key={creator._id}
                className="flex items-center justify-between rounded-md border-[0.5px] border-border px-3 py-2 text-sm text-ink"
              >
                <span>{creator.name}</span>
                <Button variant="outline" onClick={() => handleAddCreator(creator)} className="text-xs">
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {PIPELINE_STAGES.map((stage) => (
          <Card key={stage} className="space-y-2">
            <div className="text-center">
              <p className="text-xs font-medium text-ink-secondary">{stage}</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {grouped.get(stage)?.length ?? 0}
              </p>
            </div>
            <div className="space-y-1">
              {grouped.get(stage)?.map((cc) => (
                <div key={cc._id} className="rounded-md border-[0.5px] border-border p-2 text-xs">
                  <p className="font-medium text-ink">{cc.creator?.name ?? "Unknown"}</p>
                  <p className="text-ink-secondary">{cc.matchScore}% match</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {stage === "SHORTLISTED" && (
                      <button
                        onClick={() => setActiveOutreachCreatorId(cc.creatorId)}
                        className="rounded bg-teal-soft px-2 py-0.5 text-teal hover:bg-teal-soft/70"
                      >
                        Outreach
                      </button>
                    )}
                    {stage !== "COMPLETED" && (
                      <button
                        onClick={() => handleAdvance(cc, nextStage(stage))}
                        className="rounded bg-steel-100 px-2 py-0.5 text-ink-secondary hover:bg-steel-300/60"
                      >
                        Advance
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {activeOutreachCreatorId && id && (
        <Card>
          <p className="mb-2 text-sm font-medium text-ink">Outreach</p>
          <OutreachPanel
            creatorId={activeOutreachCreatorId}
            campaignId={id}
            campaign={campaign}
            onStatusChange={load}
          />
        </Card>
      )}
    </div>
  );
}
