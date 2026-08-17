import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignForm } from "../../components/campaigns/CampaignForm";
import { Card } from "../../components/ui/Card";
import { createCampaign } from "../../lib/apiClient";
import type { CampaignFormValues } from "../../lib/validation";

// Member C — Campaigns & Outreach
export default function NewCampaign() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: CampaignFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const campaign = await createCampaign(values);
      navigate(`/campaigns/${campaign._id}`);
    } catch {
      setError("Could not create campaign. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">New Campaign</h1>
      <Card>
        <CampaignForm onSubmit={handleSubmit} />
      </Card>
      {submitting && <p className="text-sm text-ink-secondary">Creating campaign...</p>}
      {error && <p className="text-sm text-caution">{error}</p>}
    </div>
  );
}
