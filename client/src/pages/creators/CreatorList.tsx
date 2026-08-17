import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../../components/search/SearchBar";
import { Filters } from "../../components/search/Filters";
import { CreatorCard } from "../../components/creators/CreatorCard";
import { Button } from "../../components/ui/Button";
import { searchCreators } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";

// Member A — Search & Discovery
export default function CreatorList() {
  const navigate = useNavigate();
  const [results, setResults] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  function handleFilterResults(filtered: Creator[]) {
    setResults(filtered);
    setSearched(true);
    setError(null);
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((existing) => existing !== id) : ids.length < 4 ? [...ids, id] : ids
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Discover Creators</h1>
      <SearchBar onSearch={handleSearch} loading={loading} />
      <Filters onResults={handleFilterResults} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-gray-500">No creators matched that search.</p>
      )}

      {selectedIds.length >= 2 && (
        <div className="flex items-center justify-between rounded-md bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          <span>{selectedIds.length} creators selected</span>
          <Button onClick={() => navigate(`/creators/compare?ids=${selectedIds.join(",")}`)}>
            Compare
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((creator) => (
          <CreatorCard
            key={creator._id}
            creator={creator}
            selected={selectedIds.includes(creator._id)}
            onToggleSelect={() => toggleSelected(creator._id)}
          />
        ))}
      </div>
    </div>
  );
}
