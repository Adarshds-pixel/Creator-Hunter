import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { fetchCampaigns } from "../../lib/apiClient";
import type { Campaign } from "../../types/campaign";

// Member C — Campaigns & Outreach
export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns()
      .then(setCampaigns)
      .catch(() => setError("Could not load campaigns."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Campaigns</h1>
        <Link to="/campaigns/new">
          <Button>New Campaign</Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading campaigns...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && campaigns.length === 0 && !error && (
        <Card>
          <p className="text-sm text-gray-500">No campaigns yet. Create one to get started.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Link key={campaign._id} to={`/campaigns/${campaign._id}`}>
            <Card className="flex h-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{campaign.name}</p>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {campaign.status ?? "DRAFT"}
                </span>
              </div>
              {campaign.brand && <p className="text-sm text-gray-500">{campaign.brand}</p>}
              <div className="mt-auto flex gap-4 text-xs text-gray-500">
                {campaign.targetCategory && <span>{campaign.targetCategory}</span>}
                {campaign.targetCountry && <span>{campaign.targetCountry}</span>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
