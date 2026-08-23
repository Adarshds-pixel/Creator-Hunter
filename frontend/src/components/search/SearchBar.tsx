import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  /** Restores the box to the last submitted query after navigating away
   *  and back, instead of showing it blank while results are still shown. */
  initialQuery?: string;
}

// Plain name search — category/followers/platform/etc. all live in
// Advanced Filters, so this box has exactly one job: match creators by name.
export function SearchBar({ onSearch, loading, initialQuery }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery ?? "");

  // useState's initializer only runs on first mount — resync when the
  // parent's submitted query changes after that (e.g. cleared elsewhere).
  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearch(query.trim());
  }

  // Clearing the box (e.g. backspacing to empty) restores the full catalog
  // immediately, without waiting for an explicit re-submit — this only
  // fires once, right at the empty transition, not on every keystroke.
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setQuery(next);
    if (next === "" && query !== "") onSearch("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-500" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search creators by name"
          className="w-full rounded-control border border-border bg-surface py-3 pl-10 pr-3 text-sm text-ink placeholder:text-ink-secondary focus:border-teal focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-control bg-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
