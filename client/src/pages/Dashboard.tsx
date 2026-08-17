import { StatTile } from "../components/dashboard/StatTile";

// Shell owned by Member A; stat tile values owned by Member C (Dev2's dashboard-summary
// API is not implemented yet, so this uses placeholder values).
const PLACEHOLDER_STATS = [
  { label: "Active Campaigns", value: 0 },
  { label: "Creators Discovered", value: 0 },
  { label: "Shortlisted", value: 0 },
  { label: "Outreach Sent", value: 0 },
  { label: "Replies", value: 0 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {PLACEHOLDER_STATS.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </div>
  );
}
