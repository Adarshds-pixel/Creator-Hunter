interface CategoryMixBarListProps {
  data: { category: string; count: number }[];
}

// Row 4's "anti-empty insurance" — always populated once creators exist,
// regardless of campaign/outreach activity.
export function CategoryMixBarList({ data }: CategoryMixBarListProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className="space-y-2.5">
      {data.map((row) => (
        <li key={row.category} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 truncate text-ink-secondary">{row.category}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-steel-100">
            <div className="h-full rounded-pill bg-indigo" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right font-data tabular-nums text-ink">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}
