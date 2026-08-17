interface CoverageStatProps {
  creators: number;
  cities: number;
  categories: number;
}

// Replaces the reference mockup's "Upgrade to Pro" sidebar slot — there's
// no billing in this app, so this shows something real instead: how much
// of the market the database actually covers.
export function CoverageStat({ creators, cities, categories }: CoverageStatProps) {
  return (
    <div className="rounded-card border border-border bg-surface-2 px-3 py-3 text-xs">
      <p className="mb-1.5 font-semibold uppercase tracking-wide text-steel-500">Database coverage</p>
      <ul className="space-y-1 text-ink-secondary">
        <li className="flex justify-between">
          <span>Creators</span>
          <span className="font-data tabular-nums text-ink">{creators.toLocaleString()}</span>
        </li>
        <li className="flex justify-between">
          <span>Cities</span>
          <span className="font-data tabular-nums text-ink">{cities}</span>
        </li>
        <li className="flex justify-between">
          <span>Categories</span>
          <span className="font-data tabular-nums text-ink">{categories}</span>
        </li>
      </ul>
    </div>
  );
}
