import { useEffect, useState } from "react";
import { StatTile } from "../components/dashboard/StatTile";
import { fetchCampaigns, fetchCreators, fetchShortlists, fetchOutreach } from "../lib/apiClient";

interface Stats {
  activeCampaigns: number;
  creatorsDiscovered: number;
  shortlisted: number;
  outreachSent: number;
  replies: number;
}

const REPLIED_STATUSES = new Set(["REPLIED", "INTERESTED", "NEGOTIATING"]);

// Member C — Campaigns & Outreach
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([fetchCampaigns(), fetchCreators({}, 1, 1), fetchShortlists(), fetchOutreach()])
      .then(([campaigns, creatorsPage, shortlists, outreach]) => {
        setStats({
          activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
          creatorsDiscovered: creatorsPage.total,
          shortlisted: shortlists.reduce((sum, s) => sum + s.creators.length, 0),
          outreachSent: outreach.filter((o) => o.status !== "DRAFT").length,
          replies: outreach.filter((o) => REPLIED_STATUSES.has(o.status)).length,
        });
      })
      .catch(() => setStats(null));
  }, []);

  const tiles = [
    { label: "Active Campaigns", value: stats?.activeCampaigns ?? 0 },
    { label: "Creators Discovered", value: stats?.creatorsDiscovered ?? 0 },
    { label: "Shortlisted", value: stats?.shortlisted ?? 0 },
    { label: "Outreach Sent", value: stats?.outreachSent ?? 0 },
    { label: "Replies", value: stats?.replies ?? 0 },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {tiles.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </div>
  );
}
