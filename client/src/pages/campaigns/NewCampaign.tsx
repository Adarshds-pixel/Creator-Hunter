import { useState } from "react";
import { CampaignForm } from "../../components/campaigns/CampaignForm";
import { Card } from "../../components/ui/Card";
import type { CampaignFormValues } from "../../lib/validation";

// Member C — Campaigns & Outreach
// Note: POST /api/campaigns is owned by Developer 2 and not implemented yet,
// so submission is held locally until that route exists.
export default function NewCampaign() {
  const [submitted, setSubmitted] = useState<CampaignFormValues | null>(null);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">New Campaign</h1>
      <Card>
        <CampaignForm onSubmit={setSubmitted} />
      </Card>

      {submitted && (
        <Card>
          <p className="text-sm text-gray-500">
            Ready to submit once Developer 2's Campaign API is available:
          </p>
          <pre className="mt-2 overflow-x-auto text-xs text-gray-700">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
