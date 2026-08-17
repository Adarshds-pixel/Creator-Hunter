import { useState, type FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  /** Restores the box to the last submitted query after navigating away
   *  and back, instead of showing it blank while results are still shown. */
  initialQuery?: string;
}

// Member A — Search & Discovery
// The gradient button is the one gradient element on this screen — the
// primary action (an AI-parsed natural-language search) earns it; nothing
// else on Discover gets the loud treatment.
export function SearchBar({ onSearch, loading, initialQuery }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim().length < 3) return;
    onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find Indian fitness creators with 50K-500K followers and engagement above 4%"
          className="w-full rounded-control border border-border bg-surface py-3 pl-10 pr-3 text-sm text-ink placeholder:text-ink-secondary focus:border-teal focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-control bg-gradient-to-r from-teal to-blue px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
      >
        <Sparkles size={16} />
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
