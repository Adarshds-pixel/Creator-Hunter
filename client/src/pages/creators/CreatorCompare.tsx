import { Card } from "../../components/ui/Card";

// Member B — Creator Intelligence (comparison table lands in Hours 36-40)
export default function CreatorCompare() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Compare Creators</h1>
      <Card>
        <p className="text-sm text-gray-500">
          Select 2-4 creators from Discover to compare Followers, Engagement, Avg Views,
          Authenticity, Match, and Estimated Cost.
        </p>
      </Card>
    </div>
  );
}
