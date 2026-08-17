import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { fetchCreators } from "../../lib/apiClient";
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

interface FiltersProps {
  onResults: (results: Creator[]) => void;
}

interface FilterState {
  category: string;
  country: string;
  city: string;
  platform: string;
  minFollowers: string;
  maxFollowers: string;
  minEngagement: string;
}

const INITIAL: FilterState = {
  category: "",
  country: "",
  city: "",
  platform: "",
  minFollowers: "",
  maxFollowers: "",
  minEngagement: "",
};

const SELECT_CLASS = "rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none";

// Member A — Search & Discovery
// Plain filtered lookup (unranked) against GET /api/creators, independent of the
// AI-ranked search box above it.
export function Filters({ onResults }: FiltersProps) {
  const [values, setValues] = useState<FilterState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange<K extends keyof FilterState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { creators } = await fetchCreators(
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
      onResults(creators);
    } catch {
      setError("Could not load filtered creators.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4 lg:grid-cols-7"
    >
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
      <Button type="submit" disabled={loading} className="col-span-2 sm:col-span-4 lg:col-span-7">
        {loading ? "Filtering..." : "Apply Filters"}
      </Button>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
