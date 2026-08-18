import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Users, TrendingUp, UserPlus, ShieldCheck, Bell, Filter as FilterIcon, LayoutGrid, List, ChevronDown } from "lucide-react";
import { SearchBar } from "../../components/search/SearchBar";
import { Filters, INITIAL_FILTERS, type FilterState } from "../../components/search/Filters";
import { CreatorCard } from "../../components/creators/CreatorCard";
import { AvatarStack } from "../../components/creators/AvatarStack";
import { FilterChip } from "../../components/creators/FilterChip";
import { Button, buttonClasses } from "../../components/ui/Button";
import { StatCard } from "../../components/dashboard/StatCard";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { Sheet } from "../../components/ui/Sheet";
import { Skeleton } from "../../components/ui/Skeleton";
import { searchCreators, fetchCreators, type CreatorSetStats } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";
import type { SearchFilters } from "../../types/search";

const STORAGE_KEY = "discover-state";

interface PersistedState {
  query: string;
  filterValues: FilterState;
  results: Creator[];
  stats: CreatorSetStats | null;
  aiFilters: SearchFilters | null;
  searched: boolean;
  selectedIds: string[];
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function computeLocalStats(creators: Creator[]): CreatorSetStats {
  const count = creators.length;
  const avg = count === 0 ? 0 : creators.reduce((sum, c) => sum + c.engagementRate, 0) / count;
  const categories = new Set(creators.map((c) => c.category)).size;
  const cities = new Set(creators.map((c) => c.city).filter(Boolean)).size;
  const verified = creators.filter((c) => c.verified).length;
  return {
    count,
    avgEngagementRate: Math.round(avg * 10) / 10,
    categories,
    cities,
    thisWeekCount: 0, // not derivable client-side from a ranked result page — omitted, not faked
    verifiedPercent: count > 0 ? Math.round((verified / count) * 100) : 0,
  };
}

const AI_FILTER_LABELS: { key: keyof SearchFilters; format: (v: NonNullable<SearchFilters[keyof SearchFilters]>) => string }[] = [
  { key: "category", format: (v) => String(v) },
  { key: "country", format: (v) => String(v) },
  { key: "city", format: (v) => String(v) },
  { key: "platform", format: (v) => String(v) },
  { key: "minFollowers", format: (v) => `≥${Number(v).toLocaleString()} followers` },
  { key: "maxFollowers", format: (v) => `≤${Number(v).toLocaleString()} followers` },
  { key: "minEngagement", format: (v) => `≥${v}% engagement` },
];

const POPULAR_SEARCHES = ["Yoga creators", "Home workout", "Weight loss", "Nutrition experts", "Gym trainers"];

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
  const [aiFilters, setAiFilters] = useState<SearchFilters | null>(initial?.aiFilters ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(initial?.searched ?? false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.selectedIds ?? []);
  const [sortKey, setSortKey] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const didInitialLoad = useRef(!!initial);

  // Persist on every relevant change — not just on unmount — so switching
  // tabs or a hard navigation doesn't lose the last search either.
  useEffect(() => {
    const state: PersistedState = { query, filterValues, results, stats, aiFilters, searched, selectedIds };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [query, filterValues, results, stats, aiFilters, searched, selectedIds]);

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
    setQuery(submittedQuery);
    setLoading(true);
    setError(null);
    try {
      const { results: ranked, filters } = await searchCreators(submittedQuery);
      setResults(ranked);
      setStats(computeLocalStats(ranked));
      setAiFilters(filters);
      setSearched(true);
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterResults(filtered: Creator[], filteredStats: CreatorSetStats) {
    setResults(filtered);
    setStats(filteredStats);
    setSearched(true);
    setError(null);
  }

  async function removeAiFilter(key: keyof SearchFilters) {
    if (!aiFilters) return;
    const next = { ...aiFilters, [key]: undefined };
    setAiFilters(next);
    setLoading(true);
    try {
      const { creators, stats: s } = await fetchCreators(
        {
          category: next.category,
          country: next.country,
          city: next.city,
          platform: next.platform,
          minFollowers: next.minFollowers,
          maxFollowers: next.maxFollowers,
          minEngagement: next.minEngagement,
        },
        1,
        60
      );
      setResults(creators);
      setStats(s);
    } catch {
      setError("Could not update results.");
    } finally {
      setLoading(false);
    }
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

  const activeAiChips = aiFilters
    ? AI_FILTER_LABELS.filter(({ key }) => aiFilters[key] != null && aiFilters[key] !== "")
    : [];

  const photoPool = results.map((c) => c.profileImage).filter((p): p is string => !!p);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Discover Creators</h1>
          <p className="text-sm text-ink-secondary">Find the perfect creators for your next campaign.</p>
        </div>
        <div className="flex items-center gap-3">
          {photoPool.length > 0 && <AvatarStack photos={photoPool} count={stats?.count ?? 0} />}
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-control border border-border p-2 text-steel-500 hover:bg-steel-100 hover:text-ink"
          >
            <Bell size={18} />
          </button>
          <Link to="/campaigns/new" className={buttonClasses("primary")}>
            + New campaign
          </Link>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} initialQuery={query} />

      {activeAiChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence>
            {activeAiChips.map(({ key, format }) => (
              <FilterChip key={key} label={format(aiFilters![key]!)} onRemove={() => removeAiFilter(key)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-secondary">Popular searches:</span>
        {POPULAR_SEARCHES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSearch(s)}
            className="rounded-pill border border-border px-3 py-1 text-xs text-ink-secondary hover:border-teal hover:text-teal"
          >
            {s}
          </button>
        ))}
      </div>

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
