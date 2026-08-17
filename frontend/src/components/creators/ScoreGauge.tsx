interface ScoreGaugeProps {
  label: string;
  value: string | number;
}

// Member B — Creator Intelligence
export function ScoreGauge({ label, value }: ScoreGaugeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-500 text-lg font-semibold text-gray-900">
        {value}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
