import { useNavigate } from "react-router-dom";
import { Calendar, MoreVertical, Users, Wallet, Radio, ArrowRight } from "lucide-react";
import { StatusPill } from "../ui/StatusPill";
import { DropdownMenu } from "../ui/DropdownMenu";
import { deleteCampaign } from "../../lib/apiClient";
import { formatFollowers, formatINR, formatShortDate } from "../../lib/format";
import type { Campaign } from "../../types/campaign";

interface CampaignCardProps {
  campaign: Campaign;
  onDeleted: () => void;
}

const STATUS_ACCENT: Record<string, string> = {
  ACTIVE: "border-l-teal",
  DRAFT: "border-l-steel-300",
  COMPLETED: "border-l-success",
  PAUSED: "border-l-amber",
};

function footerDate(campaign: Campaign): string {
  if (campaign.status === "COMPLETED") {
    return `Completed on ${formatShortDate(campaign.endDate ?? campaign.updatedAt ?? campaign.createdAt ?? new Date().toISOString())}`;
  }
  if (campaign.status === "ACTIVE") {
    return `Started on ${formatShortDate(campaign.startDate ?? campaign.createdAt ?? new Date().toISOString())}`;
  }
  return `Created on ${formatShortDate(campaign.createdAt ?? new Date().toISOString())}`;
}

// The whole card navigates via onClick+useNavigate (not a <Link> wrapper)
// so the kebab's DropdownMenu can safely stopPropagation — avoids nesting
// interactive elements inside an anchor.
export function CampaignCard({ campaign, onDeleted }: CampaignCardProps) {
  const navigate = useNavigate();

  async function handleDelete() {
    if (!campaign._id) return;
    if (!window.confirm(`Delete "${campaign.name}"? This can't be undone.`)) return;
    await deleteCampaign(campaign._id);
    onDeleted();
  }

  const progress = campaign.progress ?? 0;

  return (
    <div
      onClick={() => navigate(`/campaigns/${campaign._id}`)}
      className={`flex cursor-pointer flex-col gap-3 rounded-card border border-l-4 border-border bg-surface p-5 transition-colors hover:bg-surface-2 ${
        STATUS_ACCENT[campaign.status ?? "DRAFT"] ?? "border-l-steel-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-ink">{campaign.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={campaign.status ?? "DRAFT"} />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Campaign options"
                onClick={(e) => e.stopPropagation()}
                className="text-steel-500 hover:text-ink"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content onClick={(e) => e.stopPropagation()}>
              <DropdownMenu.Item onSelect={() => navigate(`/campaigns/${campaign._id}`)}>
                View details
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={handleDelete} className="text-danger">
                Delete campaign
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {campaign.brand && <p className="text-sm text-ink-secondary">{campaign.brand}</p>}

      {(campaign.targetCategory || campaign.targetCountry) && (
        <div className="flex flex-wrap gap-1.5">
          {campaign.targetCategory && (
            <span className="rounded-pill bg-steel-100 px-2 py-0.5 text-xs text-steel-700">
              {campaign.targetCategory}
            </span>
          )}
          {campaign.targetCountry && (
            <span className="rounded-pill bg-steel-100 px-2 py-0.5 text-xs text-steel-700">
              {campaign.targetCountry}
            </span>
          )}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary">
          <span>Progress</span>
          <span className="font-data font-semibold text-ink">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-pill bg-steel-100">
          <div className="h-full rounded-pill bg-gradient-to-r from-indigo to-blue" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t-[0.5px] border-border pt-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Users size={14} className="shrink-0 text-steel-500" />
          <div className="min-w-0">
            <p className="font-data font-medium tabular-nums text-ink">{campaign.creatorsCount ?? 0}</p>
            <p className="text-[10px] text-ink-secondary">Creators</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet size={14} className="shrink-0 text-steel-500" />
          <div className="min-w-0">
            <p className="font-data font-medium tabular-nums text-ink">
              {campaign.budget != null ? formatINR(campaign.budget) : "—"}
            </p>
            <p className="text-[10px] text-ink-secondary">Budget</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Radio size={14} className="shrink-0 text-steel-500" />
          <div className="min-w-0">
            <p className="font-data font-medium tabular-nums text-ink">{formatFollowers(campaign.reach ?? 0)}</p>
            <p className="text-[10px] text-ink-secondary">Reach</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t-[0.5px] border-border pt-3">
        <p className="inline-flex items-center gap-1 text-xs text-ink-secondary">
          <Calendar size={12} />
          {footerDate(campaign)}
        </p>
        <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-teal-soft text-teal">
          <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
}
