import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

// Member A — Search & Discovery
export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim().length < 3) return;
    onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find Indian fitness creators with 50K-500K followers and engagement above 4%"
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
