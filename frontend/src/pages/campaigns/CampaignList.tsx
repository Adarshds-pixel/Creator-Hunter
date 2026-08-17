import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Rocket, CheckCircle2, Users } from "lucide-react";
import { StatCard } from "../../components/dashboard/StatCard";
import { CampaignCard } from "../../components/campaigns/CampaignCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { fetchCampaigns } from "../../lib/apiClient";
import { formatFollowers } from "../../lib/format";
import type { Campaign } from "../../types/campaign";

// Member C — Campaigns & Outreach
export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchCampaigns()
      .then(setCampaigns)
      .catch(() => setError("Could not load campaigns."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const draftCampaigns = campaigns.filter((c) => c.status === "DRAFT").length;
  const completedCampaigns = campaigns.filter((c) => c.status === "COMPLETED").length;
  const completedThisMonth = campaigns.filter((c) => {
    if (c.status !== "COMPLETED") return false;
    const d = new Date(c.updatedAt ?? c.createdAt ?? 0);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalReach = campaigns.reduce((sum, c) => sum + (c.reach ?? 0), 0);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Campaigns</h1>
          <p className="text-sm text-ink-secondary">Manage and track all your influencer marketing campaigns.</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center gap-1.5 rounded-control bg-gradient-to-r from-indigo to-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + New Campaign
        </Link>
      </div>

      {error && <p className="text-sm text-caution">{error}</p>}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          <>
            <StatCard
              icon={Activity}
              color="indigo"
              value={totalCampaigns}
              label="Total Campaigns"
              note={activeCampaigns > 0 ? `${activeCampaigns} Active` : "None active"}
            />
            <StatCard
              icon={Rocket}
              color="blue"
              value={draftCampaigns}
              label="Draft"
              note={draftCampaigns > 0 ? "Awaiting launch" : "No drafts"}
            />
            <StatCard
              icon={CheckCircle2}
              color="success"
              value={completedCampaigns}
              label="Completed"
              note={completedThisMonth > 0 ? `${completedThisMonth} this month` : "None this month"}
            />
            <StatCard
              icon={Users}
              color="amber"
              value={`${formatFollowers(totalReach)}+`}
              label="Creators Reached"
              note="Across campaigns"
            />
          </>
        )}
      </div>

      {!loading && campaigns.length === 0 && !error && (
        <EmptyState
          title="No campaigns yet"
          description="Create a campaign to start matching it against the creator database."
          action={
            <Link
              to="/campaigns/new"
              className="inline-flex items-center gap-1.5 rounded-control bg-gradient-to-r from-indigo to-blue px-4 py-2 text-sm font-semibold text-white"
            >
              New Campaign
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-64 w-full" />)
          : campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} onDeleted={load} />
            ))}
      </div>
    </div>
  );
}
