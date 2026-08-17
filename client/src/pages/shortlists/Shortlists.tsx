import { Card } from "../../components/ui/Card";

// Member A — Search & Discovery
// Note: Shortlist API is owned by Developer 2 and not implemented yet.
export default function Shortlists() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Shortlists</h1>
      <Card>
        <p className="text-sm text-gray-500">
          Shortlists load once Developer 2's Shortlist API is available.
        </p>
      </Card>
    </div>
  );
}
