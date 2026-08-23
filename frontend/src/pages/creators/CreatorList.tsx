import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, TrendingUp, UserPlus, ShieldCheck, Filter as FilterIcon, LayoutGrid, List, ChevronDown } from "lucide-react";
import { YoutubeGlyphIcon } from "../../components/creators/platformIcons";
import { SearchBar } from "../../components/search/SearchBar";
import { Filters, INITIAL_FILTERS, type FilterState } from "../../components/search/Filters";
import { CreatorCard } from "../../components/creators/CreatorCard";
import { AvatarStack } from "../../components/creators/AvatarStack";
import { Button, buttonClasses } from "../../components/ui/Button";
import { StatCard } from "../../components/dashboard/StatCard";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { NotificationsMenu } from "../../components/layout/NotificationsMenu";
import { Sheet } from "../../components/ui/Sheet";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { fetchCreators, importCreatorFromYouTube, searchCreators, type CreatorSetStats } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";
import type { SearchFilters } from "../../types/search";

const STORAGE_KEY = "discover-state";

interface PersistedState {
  query: string;
  filterValues: FilterState;
  results: Creator[];
  stats: CreatorSetStats | null;
  searched: boolean;
  selectedIds: string[];
  appliedFilters: SearchFilters | null;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

// Derives display stats from an arbitrary set of results (used by AI search,
// which bypasses the /creators listing endpoint that normally supplies them).
function statsFromResults(creators: Creator[]): CreatorSetStats {
  const count = creators.length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const avg = count ? creators.reduce((sum, c) => sum + (c.engagementRate || 0), 0) / count : 0;
  return {
    count,
    avgEngagementRate: Math.round(avg * 10) / 10,
    categories: new Set(creators.map((c) => c.category).filter(Boolean)).size,
    cities: new Set(creators.map((c) => c.city).filter(Boolean)).size,
    thisWeekCount: creators.filter((c) => c.lastSyncedAt && new Date(c.lastSyncedAt).getTime() >= weekAgo).length,
    verifiedPercent: count ? Math.round((creators.filter((c) => c.verified).length / count) * 100) : 0,
  };
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "followers", label: "Followers" },
  { key: "engagement", label: "Engagement" },
  { key: "matchScore", label: "Match score" },
];

function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function CreatorList() {
  const navigate = useNavigate();
  const [initial] = useState(loadPersisted);
  const [query, setQuery] = useState(initial?.query ?? "");
  const [filterValues, setFilterValues] = useState<FilterState>(initial?.filterValues ?? INITIAL_FILTERS);
  const [results, setResults] = useState<Creator[]>(initial?.results ?? []);
  const [stats, setStats] = useState<CreatorSetStats | null>(initial?.stats ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(initial?.searched ?? false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.selectedIds ?? []);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters | null>(initial?.appliedFilters ?? null);
  const [sortKey, setSortKey] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const didInitialLoad = useRef(!!initial);
  const searchRequestId = useRef(0);

  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const creator = await importCreatorFromYouTube(importUrl.trim());
      // Import upserts by channel id server-side — re-importing an already-
      // known creator updates it rather than inserting a new one. Replace
      // it in place when that's the case, instead of prepending a visual
      // duplicate and over-counting "creators in database" for a row that
      // was already counted.
      setResults((prev) => {
        const existingIndex = prev.findIndex((c) => c._id === creator._id);
        if (existingIndex === -1) return [creator, ...prev];
        const next = [...prev];
        next[existingIndex] = creator;
        return next;
      });
      setStats((prev) => {
        if (!prev) return prev;
        const alreadyCounted = results.some((c) => c._id === creator._id);
        return alreadyCounted ? prev : { ...prev, count: prev.count + 1 };
      });
      setSearched(true);
      setImportOpen(false);
      setImportUrl("");
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Import failed.")
          : "Import failed.";
      setImportError(message);
    } finally {
      setImporting(false);
    }
  }

  // Persist on every relevant change — not just on unmount — so switching
  // tabs or a hard navigation doesn't lose the last search either.
  useEffect(() => {
    const state: PersistedState = { query, filterValues, results, stats, searched, selectedIds, appliedFilters };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [query, filterValues, results, stats, searched, selectedIds, appliedFilters]);

  // Populate the grid immediately on a fresh visit, not just after a search —
  // "N creators found" should already be true the moment the page loads.
  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    setLoading(true);
    fetchCreators({}, 1, 60)
      .then(({ creators, stats: s }) => {
        setResults(creators);
        setStats(s);
        setSearched(true);
      })
      .catch(() => setError("Could not load creators."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(submittedQuery: string) {
    const requestId = ++searchRequestId.current;
    setQuery(submittedQuery);
    setLoading(true);
    setError(null);

    // An empty submit resets back to the full catalog.
    if (!submittedQuery.trim()) {
      setAppliedFilters(null);
      try {
        const { creators, stats: s } = await fetchCreators({}, 1, 60);
        if (requestId !== searchRequestId.current) return;
        setResults(creators);
        setStats(s);
        setSearched(true);
      } catch {
        if (requestId === searchRequestId.current) setError("Search failed. Try again.");
      } finally {
        if (requestId === searchRequestId.current) setLoading(false);
      }
      return;
    }

    try {
      // AI-powered search: the query is parsed (Gemini) into structured
      // filters, then matched against the creator database and ranked.
      const { filters, results: found } = await searchCreators(submittedQuery);
      // A newer search may have started (and possibly already resolved)
      // while this one was in flight — don't let a slower, stale response
      // clobber it.
      if (requestId !== searchRequestId.current) return;
      setResults(found);
      setStats(statsFromResults(found));
      setAppliedFilters(filters);
      setSearched(true);
    } catch {
      if (requestId === searchRequestId.current) setError("Search failed. Try again.");
    } finally {
      if (requestId === searchRequestId.current) setLoading(false);
    }
  }

  function handleFilterResults(filtered: Creator[], filteredStats: CreatorSetStats) {
    setResults(filtered);
    setStats(filteredStats);
    setSearched(true);
    setAppliedFilters(null); // these results came from manual filters, not AI
    setError(null);
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((existing) => existing !== id) : ids.length < 4 ? [...ids, id] : ids
    );
  }

  const sortedResults = useMemo(() => {
    if (sortKey === "relevance") return results;
    const copy = [...results];
    if (sortKey === "followers") copy.sort((a, b) => b.followers - a.followers);
    if (sortKey === "engagement") copy.sort((a, b) => b.engagementRate - a.engagementRate);
    if (sortKey === "matchScore") copy.sort((a, b) => (b.matchScore ?? b.creatorScore ?? 0) - (a.matchScore ?? a.creatorScore ?? 0));
    return copy;
  }, [results, sortKey]);

  const photoPool = results.map((c) => c.profileImage).filter((p): p is string => !!p);

  const aiFilterChips = useMemo(() => {
    if (!appliedFilters) return [];
    const chips: string[] = [];
    const f = appliedFilters;
    if (f.category) chips.push(`Category: ${f.category}`);
    if (f.platform) chips.push(`Platform: ${f.platform}`);
    if (f.country) chips.push(f.country);
    if (f.city) chips.push(f.city);
    if (f.minFollowers && f.maxFollowers) chips.push(`${compactNumber(f.minFollowers)}–${compactNumber(f.maxFollowers)} followers`);
    else if (f.minFollowers) chips.push(`${compactNumber(f.minFollowers)}+ followers`);
    else if (f.maxFollowers) chips.push(`Up to ${compactNumber(f.maxFollowers)} followers`);
    if (f.minEngagement) chips.push(`${f.minEngagement}%+ engagement`);
    return chips;
  }, [appliedFilters]);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Discover Creators</h1>
          <p className="text-sm text-ink-secondary">Find the perfect creators for your next campaign.</p>
        </div>
        <div className="flex items-center gap-3">
          {photoPool.length > 0 && <AvatarStack photos={photoPool} count={stats?.count ?? 0} />}
          <NotificationsMenu />
          <Button variant="outline" onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2">
            <YoutubeGlyphIcon width={16} height={16} /> Import from YouTube
          </Button>
          <Link to="/campaigns/new" className={buttonClasses("primary")}>
            + New campaign
          </Link>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} initialQuery={query} />

      {aiFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-secondary">AI understood:</span>
          {aiFilterChips.map((chip) => (
            <span key={chip} className="rounded-full bg-teal-soft px-2.5 py-1 text-xs text-teal">
              {chip}
            </span>
          ))}
        </div>
      )}

      <Modal
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) setImportError(null);
        }}
        title="Import from YouTube"
        description="Paste a channel URL or @handle — live profile stats are fetched and saved to your database."
      >
        <div className="space-y-3">
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            placeholder="https://youtube.com/@handle"
            className="w-full rounded-md border-[0.5px] border-border bg-surface px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
          />
          {importError && <p className="text-sm text-caution">{importError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || !importUrl.trim()}>
              {importing ? "Fetching…" : "Fetch & Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {isMobile ? (
        <>
          <Button variant="outline" onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center gap-2">
            <FilterIcon size={16} /> Advanced Filters
          </Button>
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} title="Advanced Filters">
            <Filters onResults={handleFilterResults} initialValues={filterValues} onValuesChange={setFilterValues} />
          </Sheet>
        </>
      ) : (
        <Filters onResults={handleFilterResults} initialValues={filterValues} onValuesChange={setFilterValues} />
      )}

      {error && <p className="text-sm text-caution">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          <>
            <StatCard icon={Users} color="indigo" value={stats.count.toLocaleString()} label="Creators in database" note="Updated daily" />
            <StatCard
              icon={UserPlus}
              color="blue"
              value={stats.thisWeekCount}
              label="New this week"
              delta={stats.thisWeekCount > 0 ? `${stats.thisWeekCount} this week` : undefined}
              note={stats.thisWeekCount === 0 ? "No new creators this week" : undefined}
            />
            <StatCard icon={TrendingUp} color="teal" value={`${stats.avgEngagementRate}%`} label="Avg. engagement rate" note="Above industry standard" />
            <StatCard icon={ShieldCheck} color="amber" value={`${stats.verifiedPercent}%`} label="Verified creators" note="Authentic & reliable" />
          </>
        )}
      </div>

      {selectedIds.length >= 2 && (
        <div className="flex items-center justify-between rounded-md bg-teal-soft px-4 py-2 text-sm text-teal">
          <span>{selectedIds.length} creators selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium text-teal hover:underline"
            >
              Clear
            </button>
            <Button onClick={() => navigate(`/creators/compare?ids=${selectedIds.join(",")}`)}>Compare</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-secondary">
          {stats ? `${stats.count.toLocaleString()} creators found` : "Loading…"}
        </p>
        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-ink hover:bg-steel-100"
              >
                Sort by: {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
                <ChevronDown size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenu.Item key={opt.key} onSelect={() => setSortKey(opt.key)}>
                  {opt.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <div className="flex overflow-hidden rounded-control border border-border">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-teal-soft text-teal" : "text-steel-500 hover:bg-steel-100"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-teal-soft text-teal" : "text-steel-500 hover:bg-steel-100"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-ink-secondary">No creators matched that search.</p>
      )}

      <div
        className={
          viewMode === "list"
            ? "grid grid-cols-1 gap-4"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1600px]:grid-cols-4"
        }
      >
        {sortedResults.map((creator) => (
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
