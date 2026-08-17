import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { EmptyState } from "../ui/EmptyState";

export interface DonutSegment {
  label: string;
  value: number;
  colorVar: string; // CSS custom property name, e.g. "--color-teal"
}

interface DonutStatProps {
  title: string;
  segments: DonutSegment[];
  emptyTitle: string;
  emptyDescription: string;
}

// Only ever fed genuinely comparable quantities (the outreach funnel) — no
// mixed/meaningless totals. Centers on the top-of-funnel count, not a sum.
export function DonutStat({ title, segments, emptyTitle, emptyDescription }: DonutStatProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const headline = segments[0];

  if (total === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const data = segments.map((s) => ({ name: s.label, value: s.value, colorVar: s.colorVar }));

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={72} stroke="none">
              {data.map((entry) => (
                <Cell key={entry.name} fill={`var(${entry.colorVar})`} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-data text-2xl font-semibold tabular-nums text-ink">{headline?.value ?? 0}</p>
          <p className="text-[11px] text-ink-secondary">{headline?.label}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-steel-500">{title}</p>
        <ul>
          {segments.map((s, i) => (
            <li
              key={s.label}
              className={`flex items-center justify-between gap-2 py-2 text-sm ${
                i > 0 ? "border-t-[0.5px] border-border" : ""
              }`}
            >
              <span className="flex items-center gap-2 text-ink-secondary">
                <span className="h-2 w-2 shrink-0 rounded-pill" style={{ backgroundColor: `var(${s.colorVar})` }} />
                {s.label}
              </span>
              <span className="font-data tabular-nums text-ink">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
