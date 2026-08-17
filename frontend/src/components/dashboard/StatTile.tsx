import { Card } from "../ui/Card";

interface StatTileProps {
  label: string;
  value: string | number;
}

// Member C — Campaigns & Outreach
export function StatTile({ label, value }: StatTileProps) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Card>
  );
}
