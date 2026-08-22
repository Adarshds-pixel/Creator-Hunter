import { Link } from "react-router-dom";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { ScoreStrip } from "../scoring/ScoreStrip";
import { PLATFORM_ICON } from "./platformIcons";
import { ShortlistPickerModal } from "../shortlists/ShortlistPickerModal";
import { formatFollowers, formatINR, formatPercent } from "../../lib/format";
import type { Creator } from "../../types/creator";

interface CreatorCardProps {
  creator: Creator;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const emptyBreakdown = { audience: 0, engagement: 0, contentRelevance: 0, location: 0, follower: 0, price: 0 };

const PLATFORM_RING: Record<string, string> = {
  Instagram: "ring-magenta",
  YouTube: "ring-danger",
  LinkedIn: "ring-blue",
};

// >=5% success, 2-5% neutral, <2% warning — mirrors the reference mockup's
// engagement color semantics.
function engagementTone(rate: number): "success" | "ink" | "warning" {
  if (rate >= 5) return "success";
  if (rate >= 2) return "ink";
  return "warning";
}

// Member A — Search & Discovery (base card); compare-select (Member B) and
// add-to-shortlist (Member C) actions layered on top of the same card.
export function CreatorCard({ creator, selected, onToggleSelect }: CreatorCardProps) {
  const [added, setAdded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const PlatformIcon = PLATFORM_ICON[creator.platform];
  const visibleTags = creator.tags?.slice(0, 3) ?? [];
  const overflowTagCount = (creator.tags?.length ?? 0) - visibleTags.length;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="mt-9"
              aria-label={`Select ${creator.name} for comparison`}
            />
          )}
          <Link to={`/creators/${creator._id}`} className="flex min-w-0 items-start gap-3">
            <Avatar
              src={creator.profileImage}
              name={creator.name}
              size={56}
              ringClassName={PLATFORM_RING[creator.platform]}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="truncate font-semibold text-ink hover:underline">{creator.name}</p>
                {creator.verified && <ShieldCheck size={14} className="shrink-0 text-teal" aria-label="Verified" />}
              </div>
              <p className="truncate text-sm text-ink-secondary">@{creator.username}</p>
              <p className="truncate text-xs text-ink-secondary">
                {creator.title ?? creator.category}
                {creator.location ? ` · ${creator.location.split(",")[0]}` : ""}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-steel-500">
                {PlatformIcon && <PlatformIcon width={13} height={13} />}
              </div>
            </div>
          </Link>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {creator.source && creator.source !== "DATASET" && (
            <span className="rounded-md bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
              Live
            </span>
          )}
          {creator.matchScore != null && (
            <span className="rounded-md bg-success-soft px-2 py-0.5 text-[13px] font-semibold text-success">
              {Math.round(creator.matchScore)}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 border-y-[0.5px] border-border py-3 text-sm">
        <Metric label="Followers" value={formatFollowers(creator.followers)} />
        <Metric
          label="Engagement"
          value={formatPercent(creator.engagementRate)}
          tone={engagementTone(creator.engagementRate)}
        />
        <Metric label="Authenticity" value={String(creator.authenticityScore)} />
        <Metric label="Est. cost" value={formatINR(creator.estimatedCost)} />
      </div>

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span key={tag} className="rounded-pill bg-steel-100 px-2 py-0.5 text-xs text-steel-700">
              {tag}
            </span>
          ))}
          {overflowTagCount > 0 && (
            <span className="rounded-pill bg-steel-100 px-2 py-0.5 text-xs text-steel-700">+{overflowTagCount}</span>
          )}
        </div>
      )}

      {creator.matchBreakdown && <ScoreStrip matchScore={creator.matchScore ?? 0} breakdown={creator.matchBreakdown ?? emptyBreakdown} />}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPickerOpen(true)} disabled={added} className="text-xs">
            {added ? "Added" : "Shortlist"}
          </Button>
          {onToggleSelect && (
            <Button variant="outline" onClick={onToggleSelect} className="text-xs">
              {selected ? "Selected" : "Compare"}
            </Button>
          )}
        </div>
        <Link to={`/creators/${creator._id}`} className="text-sm font-medium text-teal hover:underline">
          View profile →
        </Link>
      </div>

      <ShortlistPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        creatorId={creator._id}
        creatorName={creator.name}
        onAdded={() => {
          setAdded(true);
          setPickerOpen(false);
        }}
      />
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "ink" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-ink";
  return (
    <div>
      <p className={`font-data text-sm font-medium tabular-nums ${toneClass}`}>{value}</p>
      <p className="text-xs text-ink-secondary">{label}</p>
    </div>
  );
}
