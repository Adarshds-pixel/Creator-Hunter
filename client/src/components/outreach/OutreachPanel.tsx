import { useState } from "react";
import { Button } from "../ui/Button";
import {
  generateOutreachMessage,
  createOutreach,
  updateOutreachStatus,
  updateCampaignCreator,
} from "../../lib/apiClient";
import type { Campaign } from "../../types/campaign";
import type { OutreachStatusType } from "../../types/outreach";

interface OutreachPanelProps {
  creatorId: string;
  campaignId: string;
  campaign?: Partial<Campaign>;
  channel?: string;
  onStatusChange?: () => void;
}

const REPLY_STATUSES: OutreachStatusType[] = [
  "REPLIED",
  "INTERESTED",
  "NEGOTIATING",
  "NO_RESPONSE",
  "REJECTED",
];

// Outreach statuses that also exist as CampaignCreator pipeline statuses —
// the pipeline board groups by CampaignCreator.status, so these need to be
// written back there too, not just onto the Outreach record.
const PIPELINE_SYNCED_STATUSES = ["CONTACTED", "REPLIED", "NEGOTIATING", "REJECTED"] as const;
type PipelineSyncedStatus = (typeof PIPELINE_SYNCED_STATUSES)[number];

function isPipelineSyncedStatus(status: OutreachStatusType): status is PipelineSyncedStatus {
  return (PIPELINE_SYNCED_STATUSES as readonly string[]).includes(status);
}

// Member C — Campaigns & Outreach
export function OutreachPanel({
  creatorId,
  campaignId,
  campaign,
  channel = "INSTAGRAM",
  onStatusChange,
}: OutreachPanelProps) {
  const [message, setMessage] = useState("");
  const [outreachId, setOutreachId] = useState<string | null>(null);
  const [status, setStatus] = useState<OutreachStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
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

  async function handleSend() {
    if (!message) return;
    setSending(true);
    setError(null);
    try {
      const outreach = await createOutreach({
        campaignId,
        creatorId,
        channel,
        message,
        status: "CONTACTED",
      });
      setOutreachId(outreach._id);
      setStatus(outreach.status);
      if (isPipelineSyncedStatus(outreach.status)) {
        await updateCampaignCreator(campaignId, creatorId, { status: outreach.status });
      }
      onStatusChange?.();
    } catch {
      setError("Could not send outreach.");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusUpdate(nextStatus: OutreachStatusType) {
    if (!outreachId) return;
    try {
      const outreach = await updateOutreachStatus(outreachId, nextStatus);
      setStatus(outreach.status);
      if (isPipelineSyncedStatus(outreach.status)) {
        await updateCampaignCreator(campaignId, creatorId, { status: outreach.status });
      }
      onStatusChange?.();
    } catch {
      setError("Could not update outreach status.");
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

      {message && !outreachId && (
        <Button onClick={handleSend} disabled={sending} variant="secondary">
          {sending ? "Sending..." : "Send & Mark Contacted"}
        </Button>
      )}

      {outreachId && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">Status: {status}</span>
          {REPLY_STATUSES.filter((s) => s !== status).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusUpdate(s)}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              Mark {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
