import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";

const PIPELINE_STAGES = [
  "DISCOVERED",
  "SHORTLISTED",
  "CONTACTED",
  "REPLIED",
  "NEGOTIATING",
  "APPROVED",
  "CONTENT_SUBMITTED",
  "COMPLETED",
] as const;

// Member C — Campaigns & Outreach
// Note: campaign + CampaignCreator data loads once Developer 2's APIs are available.
export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Campaign Pipeline — {id}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {PIPELINE_STAGES.map((stage) => (
          <Card key={stage} className="text-center">
            <p className="text-xs font-medium text-gray-500">{stage}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">0</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
