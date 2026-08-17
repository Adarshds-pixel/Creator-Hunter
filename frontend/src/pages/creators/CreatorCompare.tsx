import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { fetchCreator } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";

const ROWS: { label: string; render: (c: Creator) => string }[] = [
  { label: "Followers", render: (c) => c.followers.toLocaleString() },
  { label: "Engagement", render: (c) => `${c.engagementRate}%` },
  { label: "Avg Views", render: (c) => c.avgViews.toLocaleString() },
  { label: "Authenticity", render: (c) => `${c.authenticityScore}` },
  { label: "Match", render: (c) => (c.matchScore != null ? `${c.matchScore}%` : "—") },
  { label: "Est. Cost", render: (c) => `₹${c.estimatedCost.toLocaleString()}` },
];

// Member B — Creator Intelligence
export default function CreatorCompare() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 4);

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
  }, [idsParam]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Compare Creators</h1>

      {ids.length < 2 && (
        <Card>
          <p className="text-sm text-gray-500">
            Select 2-4 creators from Discover to compare Followers, Engagement, Avg Views,
            Authenticity, Match, and Estimated Cost.
          </p>
        </Card>
      )}

      {loading && <p className="text-sm text-gray-500">Loading creators...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {creators.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Metric</th>
                {creators.map((c) => (
                  <th key={c._id} className="px-3 py-2 text-left font-medium text-gray-900">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="px-3 py-2 font-medium text-gray-700">{row.label}</td>
                  {creators.map((c) => (
                    <td key={c._id} className="px-3 py-2 text-gray-900">
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
