import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface DiscoveryInsightsChartProps {
  data: { date: string; count: number }[];
}

function formatAxisDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function DiscoveryInsightsChart({ data }: DiscoveryInsightsChartProps) {
  // Dot only on the last point — a chart that scatters a dot on every one
  // of 30 days is visual noise; the last point is the one worth calling out.
  function renderDot(props: { cx?: number; cy?: number; index?: number }) {
    if (props.index !== data.length - 1 || props.cx == null || props.cy == null) {
      return <g key={props.index} />;
    }
    return (
      <circle
        key={props.index}
        cx={props.cx}
        cy={props.cy}
        r={4}
        fill="var(--color-teal)"
        stroke="var(--color-surface)"
        strokeWidth={2}
      />
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="discoveryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 11, fill: "var(--color-ink-secondary)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            interval={Math.max(0, Math.floor(data.length / 6) - 1)}
          />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-secondary)" }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(value) => formatAxisDate(String(value))}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-teal)"
            strokeWidth={2}
            fill="url(#discoveryFill)"
            dot={renderDot}
            activeDot={{ r: 4, fill: "var(--color-teal)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
