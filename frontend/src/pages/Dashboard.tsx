import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Star, Send, MessageCircle, Bell, Calendar } from "lucide-react";
import { buttonClasses } from "../components/ui/Button";
import { StatusPill } from "../components/ui/StatusPill";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { DropdownMenu } from "../components/ui/DropdownMenu";
import { StatCard } from "../components/dashboard/StatCard";
import { DataTable, type DataTableColumn } from "../components/dashboard/DataTable";
import { DonutStat } from "../components/dashboard/DonutStat";
import { ActivityList } from "../components/dashboard/ActivityRow";
import { DiscoveryInsightsChart } from "../components/dashboard/DiscoveryInsightsChart";
import { CategoryMixBarList } from "../components/dashboard/CategoryMixBarList";
import { PlatformMixList } from "../components/dashboard/PlatformMixList";
import { fetchDashboardStats, type DashboardStats } from "../lib/apiClient";
import { formatPercent, formatShortDate } from "../lib/format";
import type { Campaign } from "../types/campaign";

// Member C — Campaigns & Outreach
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const columns: DataTableColumn<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      sortValue: (c) => c.name,
      render: (c) => (
        <Link to={`/campaigns/${c._id}`} className="font-medium text-teal hover:underline">
          {c.name}
        </Link>
      ),
    },
    { key: "brand", header: "Brand", sortValue: (c) => c.brand ?? "", render: (c) => c.brand ?? "—" },
    {
      key: "status",
      header: "Status",
      sortValue: (c) => c.status ?? "",
      render: (c) => <StatusPill status={c.status ?? "DRAFT"} />,
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      sortValue: (c) => c.budget ?? 0,
      render: (c) => (
        <span className="font-data tabular-nums text-ink">
          {c.budget != null ? `₹${c.budget.toLocaleString("en-IN")}` : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (c) => {
        const createdAt = (c as unknown as { createdAt?: string }).createdAt;
        return createdAt ? (
          <span className="inline-flex items-center gap-1.5 text-ink-secondary">
            <Calendar size={13} /> {formatShortDate(createdAt)}
          </span>
        ) : (
          "—"
        );
      },
    },
  ];

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-secondary">Welcome back! Here's what's happening with your campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-control border border-border p-2 text-steel-500 hover:bg-steel-100 hover:text-ink"
          >
            <Bell size={18} />
          </button>
          <Link to="/campaigns/new" className={buttonClasses("primary")}>
            + New campaign
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-caution">
          Couldn't load your dashboard data. Check that the API is running and reload the page.
        </p>
      )}

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {!stats && !error
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : stats && (
              <>
                <StatCard
                  icon={Users}
                  color="indigo"
                  value={stats.kpis.creatorsTotal.toLocaleString()}
                  label="Creators Discovered"
                  delta={stats.kpis.creatorsThisWeek > 0 ? `+${stats.kpis.creatorsThisWeek} this week` : undefined}
                  note={stats.kpis.creatorsThisWeek === 0 ? "No new creators this week" : undefined}
                />
                <StatCard
                  icon={TrendingUp}
                  color="teal"
                  value={formatPercent(stats.kpis.avgEngagementRate)}
                  label="Avg. Engagement"
                  note="Across the full database"
                />
                <StatCard
                  icon={Star}
                  color="amber"
                  value={stats.kpis.shortlistedCount}
                  label="Shortlisted"
                  note={stats.kpis.shortlistedCount === 0 ? "No creators shortlisted yet" : "Across all shortlists"}
                />
                <StatCard
                  icon={Send}
                  color="blue"
                  value={stats.kpis.outreachSentCount}
                  label="Outreach Sent"
                  note={stats.kpis.outreachSentCount === 0 ? "No outreach sent" : undefined}
                />
                <StatCard
                  icon={MessageCircle}
                  color="magenta"
                  value={stats.kpis.repliesCount}
                  label="Replies"
                  note={stats.kpis.repliesCount === 0 ? "No replies yet" : undefined}
                />
              </>
            )}
      </div>

      {/* Row 2 — Recent Campaigns + Outreach Funnel */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-steel-500">Recent Campaigns</p>
              <Link to="/campaigns" className="text-sm font-medium text-teal hover:underline">
                View all →
              </Link>
            </div>
            {!stats && !error && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {stats && stats.recentCampaigns.length === 0 && (
              <EmptyState
                title="No campaigns yet"
                description="Create a campaign to start matching it against the creator database."
                action={
                  <Link to="/campaigns/new" className={buttonClasses("primary")}>
                    New campaign
                  </Link>
                }
              />
            )}
            {stats && stats.recentCampaigns.length > 0 && (
              <DataTable
                columns={columns}
                rows={stats.recentCampaigns}
                rowKey={(c) => c._id ?? c.name}
                rowActions={(c) => (
                  <DropdownMenu.Item asChild>
                    <Link to={`/campaigns/${c._id}`}>View campaign</Link>
                  </DropdownMenu.Item>
                )}
              />
            )}
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card className="h-full">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Outreach Funnel</p>
            {!stats && !error && <Skeleton className="h-40 w-full" />}
            {stats && (
              <DonutStat
                title="Funnel"
                emptyTitle="Nothing tracked yet"
                emptyDescription="The funnel fills in as creators move from discovered to shortlisted, contacted, and replied within a campaign."
                segments={[
                  { label: "Discovered", value: stats.outreachFunnel.discovered, colorVar: "--color-indigo" },
                  { label: "Shortlisted", value: stats.outreachFunnel.shortlisted, colorVar: "--color-amber" },
                  { label: "Contacted", value: stats.outreachFunnel.contacted, colorVar: "--color-blue" },
                  { label: "Replied", value: stats.outreachFunnel.replied, colorVar: "--color-magenta" },
                ]}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Row 3 — Discovery Insights + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Discovery Insights</p>
            {!stats && !error && <Skeleton className="h-56 w-full" />}
            {stats && <DiscoveryInsightsChart data={stats.discoveryInsights} />}
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card className="h-full">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Recent Activity</p>
            {!stats && !error && <Skeleton className="h-56 w-full" />}
            {stats && <ActivityList items={stats.recentActivity} />}
          </Card>
        </div>
      </div>

      {/* Row 4 — Creator database mix (always populated) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Creator Database — Categories</p>
            {!stats && !error && <Skeleton className="h-48 w-full" />}
            {stats && <CategoryMixBarList data={stats.categoryMix} />}
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card>
            {!stats && !error && <Skeleton className="h-48 w-full" />}
            {stats && <PlatformMixList platformMix={stats.platformMix} followerTierMix={stats.followerTierMix} />}
          </Card>
        </div>
      </div>
    </div>
  );
}
