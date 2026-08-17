import { useState } from "react";
import { SearchBar } from "../../components/search/SearchBar";
import { CreatorCard } from "../../components/creators/CreatorCard";
import { searchCreators } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";

// Member A — Search & Discovery
export default function CreatorList() {
  const [results, setResults] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    try {
      const { results } = await searchCreators(query);
      setResults(results);
      setSearched(true);
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Discover Creators</h1>
      <SearchBar onSearch={handleSearch} loading={loading} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-gray-500">No creators matched that search.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((creator) => (
          <CreatorCard key={creator._id} creator={creator} />
        ))}
      </div>
    </div>
  );
}
