import { Link } from "react-router-dom";
import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { addCreatorToDefaultShortlist } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";

interface CreatorCardProps {
  creator: Creator;
  selected?: boolean;
  onToggleSelect?: () => void;
}

// Member A — Search & Discovery (base card); compare-select (Member B) and
// add-to-shortlist (Member C) actions layered on top of the same card.
export function CreatorCard({ creator, selected, onToggleSelect }: CreatorCardProps) {
  const [added, setAdded] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);

  async function handleAddToShortlist() {
    setShortlistError(null);
    try {
      await addCreatorToDefaultShortlist(creator._id);
      setAdded(true);
    } catch {
      setShortlistError("Could not add to shortlist.");
    }
  }

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="mt-1"
              aria-label={`Select ${creator.name} for comparison`}
            />
          )}
          <div>
            <p className="font-semibold text-gray-900">{creator.name}</p>
            <p className="text-sm text-gray-500">
              @{creator.username} · {creator.platform}
            </p>
          </div>
        </div>
        {creator.matchScore != null && (
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
            {creator.matchScore}% match
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="font-semibold text-gray-900">{creator.followers?.toLocaleString()}</p>
          <p className="text-gray-500">Followers</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{creator.engagementRate}%</p>
          <p className="text-gray-500">Engagement</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{creator.authenticityScore}</p>
          <p className="text-gray-500">Authenticity</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/creators/${creator._id}`}
          className="flex-1 text-center text-sm font-medium text-indigo-600 hover:underline"
        >
          View profile
        </Link>
        <Button variant="outline" onClick={handleAddToShortlist} disabled={added} className="text-xs">
          {added ? "Added" : "Shortlist"}
        </Button>
      </div>
      {shortlistError && <p className="text-xs text-red-600">{shortlistError}</p>}
    </Card>
  );
}
