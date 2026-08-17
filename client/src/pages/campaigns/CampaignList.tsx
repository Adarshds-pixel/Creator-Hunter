import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

// Member C — Campaigns & Outreach
// Note: GET /api/campaigns is owned by Developer 2 and not implemented yet.
export default function CampaignList() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Campaigns</h1>
        <Link to="/campaigns/new">
          <Button>New Campaign</Button>
        </Link>
      </div>

      <Card>
        <p className="text-sm text-gray-500">
          Campaign list loads once Developer 2's Campaign API is available.
        </p>
      </Card>
    </div>
  );
}
