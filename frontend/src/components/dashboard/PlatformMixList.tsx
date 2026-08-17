interface PlatformMixListProps {
  platformMix: { platform: string; count: number }[];
  followerTierMix: { tier: string; count: number }[];
}

function MiniBarRow({ label, count, max, colorClass }: { label: string; count: number; max: number; colorClass: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-ink-secondary">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-steel-100">
        <div className={`h-full rounded-pill ${colorClass}`} style={{ width: `${(count / max) * 100}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-data tabular-nums text-ink">{count}</span>
    </li>
  );
}

export function PlatformMixList({ platformMix, followerTierMix }: PlatformMixListProps) {
  const platformMax = Math.max(1, ...platformMix.map((d) => d.count));
  const tierMax = Math.max(1, ...followerTierMix.map((d) => d.count));

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-500">Platforms</p>
        <ul className="space-y-2">
          {platformMix.map((row) => (
            <MiniBarRow key={row.platform} label={row.platform} count={row.count} max={platformMax} colorClass="bg-blue" />
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-500">Follower tiers</p>
        <ul className="space-y-2">
          {followerTierMix.map((row) => (
            <MiniBarRow key={row.tier} label={row.tier} count={row.count} max={tierMax} colorClass="bg-magenta" />
          ))}
        </ul>
      </div>
    </div>
  );
}
