import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { fetchCreators, type CreatorSetStats } from "../../lib/apiClient";
import type { Creator } from "../../types/creator";

const CATEGORIES = [
  "Fitness", "Gaming", "Technology", "Beauty", "Fashion",
  "Finance", "Food", "Travel", "Education", "Lifestyle",
];

const COUNTRIES = ["India", "USA", "UK", "UAE"];

const CITIES = [
  "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad",
  "New York", "Los Angeles", "London", "Manchester", "Dubai", "Abu Dhabi",
];

const PLATFORMS = ["Instagram", "YouTube", "LinkedIn"];

export interface FilterState {
  category: string;
  country: string;
  city: string;
  platform: string;
  minFollowers: string;
  maxFollowers: string;
  minEngagement: string;
}

export const INITIAL_FILTERS: FilterState = {
  category: "",
  country: "",
  city: "",
  platform: "",
  minFollowers: "",
  maxFollowers: "",
  minEngagement: "",
};

interface FiltersProps {
  onResults: (results: Creator[], stats: CreatorSetStats) => void;
  /** Restores the form to a previous selection — e.g. after navigating to a
   *  creator profile and back — instead of resetting to blank. */
  initialValues?: FilterState;
  /** Mirrors every field change up so the parent can persist the current
   *  selection immediately, not just after a fetch resolves. */
  onValuesChange?: (values: FilterState) => void;
}

const SELECT_CLASS = "rounded-control border border-border bg-surface px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none";

function hasActiveFilter(values: FilterState): boolean {
  return Object.values(values).some((v) => v !== "");
}

// Member A — Search & Discovery
// Plain filtered lookup (unranked) against GET /api/creators, independent of the
// AI-ranked search box above it. Applies on change with a 300ms debounce — no
// explicit submit button — guarded by a request-id so a fast edit followed by
// a slower one can't have the stale response clobber the fresher result.
export function Filters({ onResults, initialValues, onValuesChange }: FiltersProps) {
  const [values, setValues] = useState<FilterState>(initialValues ?? INITIAL_FILTERS);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const skipNextFetch = useRef(true); // mounting shouldn't re-trigger a fetch — CreatorList owns the initial load

  function handleChange<K extends keyof FilterState>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => {
        const next = { ...v, [key]: e.target.value };
        onValuesChange?.(next);
        return next;
      });
  }

  function clearAll() {
    skipNextFetch.current = false;
    setValues(INITIAL_FILTERS);
    onValuesChange?.(INITIAL_FILTERS);
  }

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { creators, stats } = await fetchCreators(
          {
            category: values.category || undefined,
            country: values.country || undefined,
            city: values.city || undefined,
            platform: values.platform || undefined,
            minFollowers: values.minFollowers ? Number(values.minFollowers) : undefined,
            maxFollowers: values.maxFollowers ? Number(values.maxFollowers) : undefined,
            minEngagement: values.minEngagement ? Number(values.minEngagement) : undefined,
          },
          1,
          60
        );
        if (id === requestId.current) onResults(creators, stats);
      } catch {
        if (id === requestId.current) setError("Could not load filtered creators.");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.category, values.country, values.city, values.platform, values.minFollowers, values.maxFollowers, values.minEngagement]);

  return (
    <div className="rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <Filter size={16} className="text-steel-500" />
          Advanced Filters
          {loading && <span className="text-xs font-normal text-ink-secondary">Filtering…</span>}
        </span>
        <span className="flex items-center gap-3">
          {hasActiveFilter(values) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-xs font-medium text-teal hover:underline"
            >
              Clear all
            </span>
          )}
          <ChevronDown size={16} className={`text-steel-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-3 border-t-[0.5px] border-border p-4 sm:grid-cols-4 lg:grid-cols-7">
          <select value={values.category} onChange={handleChange("category")} className={SELECT_CLASS}>
            <option value="">Category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={values.country} onChange={handleChange("country")} className={SELECT_CLASS}>
            <option value="">Country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={values.city} onChange={handleChange("city")} className={SELECT_CLASS}>
            <option value="">City</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={values.platform} onChange={handleChange("platform")} className={SELECT_CLASS}>
            <option value="">Platform</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            placeholder="Min followers"
            value={values.minFollowers}
            onChange={handleChange("minFollowers")}
            className={SELECT_CLASS}
          />
          <input
            type="number"
            min={0}
            placeholder="Max followers"
            value={values.maxFollowers}
            onChange={handleChange("maxFollowers")}
            className={SELECT_CLASS}
          />
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="Min engagement %"
            value={values.minEngagement}
            onChange={handleChange("minEngagement")}
            className={SELECT_CLASS}
          />
        </div>
      )}
      {error && <p className="px-4 pb-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
