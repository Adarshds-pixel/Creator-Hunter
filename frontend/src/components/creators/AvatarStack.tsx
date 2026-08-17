import { formatFollowers } from "../../lib/format";

interface AvatarStackProps {
  photos: string[];
  count: number;
}

// Pure decoration (per the design spec) — but the cheapest thing that makes
// the Discover header feel populated with a real, live database count.
export function AvatarStack({ photos, count }: AvatarStackProps) {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        {photos.slice(0, 3).map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt=""
            className="h-9 w-9 rounded-pill border-2 border-paper object-cover"
            style={{ zIndex: 3 - i }}
          />
        ))}
      </div>
      <div className="-ml-3 flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-pill border-2 border-teal bg-surface text-center">
        <span className="font-data text-[11px] font-semibold leading-none text-ink">{formatFollowers(count)}+</span>
        <span className="text-[8px] leading-none text-ink-secondary">Creators</span>
      </div>
    </div>
  );
}
