import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import type { Creator } from "../../types/creator";

interface CreatorCardProps {
  creator: Creator;
}

// Member A — Search & Discovery
export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{creator.name}</p>
          <p className="text-sm text-gray-500">
            @{creator.username} · {creator.platform}
          </p>
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

      <Link
        to={`/creators/${creator._id}`}
        className="mt-2 text-center text-sm font-medium text-indigo-600 hover:underline"
      >
        View profile
      </Link>
    </Card>
  );
}
