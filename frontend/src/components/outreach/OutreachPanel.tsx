import { useState, type ElementType } from "react";
import { Mail, MessageCircle, Copy, Check, RefreshCw, Send } from "lucide-react";
import { InstagramIcon, LinkedinGlyphIcon } from "../creators/platformIcons";
import { Button } from "../ui/Button";
import {
  generateOutreachMessage,
  createOutreach,
  updateOutreachStatus,
  updateCampaignCreator,
} from "../../lib/apiClient";
import type { Campaign } from "../../types/campaign";
import { OUTREACH_CHANNELS, type OutreachChannelType, type OutreachStatusType } from "../../types/outreach";

interface OutreachPanelProps {
  creatorId: string;
  campaignId: string;
  campaign?: Partial<Campaign>;
  onStatusChange?: () => void;
}

// lucide-react (this version) ships no brand/logo icons — Instagram/LinkedIn
// use the hand-drawn mono glyphs from platformIcons.tsx instead (see the
// comment there); Mail/MessageCircle stand in for Email/WhatsApp since
// those are generic, non-brand icons lucide does ship.
const CHANNEL_META: Record<OutreachChannelType, { label: string; icon: ElementType }> = {
  INSTAGRAM: { label: "Instagram", icon: InstagramIcon },
  EMAIL: { label: "Email", icon: Mail },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  LINKEDIN: { label: "LinkedIn", icon: LinkedinGlyphIcon },
};

const STATUS_LABELS: Record<OutreachStatusType, string> = {
  DRAFT: "Draft",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  INTERESTED: "Interested",
  NEGOTIATING: "Negotiating",
  REJECTED: "Rejected",
  NO_RESPONSE: "No response",
};

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

// Mount with `key={creatorId}` from the parent so switching which creator
// this panel targets remounts it fresh instead of carrying over stale
// message/channel/status state from whoever was open before.
export function OutreachPanel({ creatorId, campaignId, campaign, onStatusChange }: OutreachPanelProps) {
  const [channel, setChannel] = useState<OutreachChannelType>("INSTAGRAM");
  const [message, setMessage] = useState("");
  const [outreachId, setOutreachId] = useState<string | null>(null);
  const [status, setStatus] = useState<OutreachStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Once sent, the channel is locked in — switching it would silently
  // orphan the already-created Outreach record.
  const sent = outreachId !== null;

  function handleChannelSelect(next: OutreachChannelType) {
    if (sent || next === channel) return;
    setChannel(next);
    setMessage("");
    setError(null);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateOutreachMessage(creatorId, campaign, channel);
      setMessage(data.message);
    } catch {
      setError("Could not generate a message right now — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!message.trim()) return;
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
      setError("Could not send this message — try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusUpdate(nextStatus: OutreachStatusType) {
    if (!outreachId) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const outreach = await updateOutreachStatus(outreachId, nextStatus);
      setStatus(outreach.status);
      if (isPipelineSyncedStatus(outreach.status)) {
        await updateCampaignCreator(campaignId, creatorId, { status: outreach.status });
      }
      onStatusChange?.();
    } catch {
      setError("Could not update the status — try again.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">Channel</p>
        <div className="flex flex-wrap gap-2">
          {OUTREACH_CHANNELS.map((c) => {
            const meta = CHANNEL_META[c];
            const Icon = meta.icon;
            const active = c === channel;
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleChannelSelect(c)}
                disabled={sent && !active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "bg-teal text-white"
                    : "bg-steel-100 text-ink-secondary hover:bg-steel-300/60"
                }`}
              >
                <Icon width={13} height={13} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {!sent && (
        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant={message ? "outline" : "primary"}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Generating…" : message ? "Regenerate" : "Generate outreach"}
        </Button>
      )}

      {error && <p className="text-sm text-caution">{error}</p>}

      {message && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          readOnly={sent}
          rows={6}
          className="w-full resize-y rounded-md border-[0.5px] border-border bg-steel-100 p-3 text-sm leading-relaxed text-ink focus:border-teal focus:outline-none read-only:cursor-default"
        />
      )}

      {message && !sent && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            variant="secondary"
            className="inline-flex items-center gap-2"
          >
            <Send size={14} />
            {sending ? "Sending…" : "Send & mark contacted"}
          </Button>
          <Button onClick={handleCopy} variant="outline" className="inline-flex items-center gap-2">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}

      {sent && (
        <div className="space-y-3 border-t-[0.5px] border-border pt-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-ink-secondary">Status</span>
            <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal">
              {status ? STATUS_LABELS[status] : "—"}
            </span>
            <button
              onClick={handleCopy}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy message"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {REPLY_STATUSES.filter((s) => s !== status).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                disabled={updatingStatus}
                className="rounded-full bg-steel-100 px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-steel-300/60 disabled:opacity-50"
              >
                Mark {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
