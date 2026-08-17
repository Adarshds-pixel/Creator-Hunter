import { useState } from "react";
import { Button } from "../ui/Button";
import { generateOutreachMessage } from "../../lib/apiClient";
import type { Campaign } from "../../types/campaign";

interface OutreachPanelProps {
  creatorId: string;
  campaign?: Partial<Campaign>;
  channel?: string;
}

// Member C — Campaigns & Outreach
export function OutreachPanel({ creatorId, campaign, channel = "INSTAGRAM" }: OutreachPanelProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateOutreachMessage(creatorId, campaign, channel);
      setMessage(data.message);
    } catch {
      setError("Could not generate outreach message yet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Outreach"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {message && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
          {message}
        </div>
      )}
    </div>
  );
}
