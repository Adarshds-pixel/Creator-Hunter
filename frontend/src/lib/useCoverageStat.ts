import { useEffect, useState } from "react";
import { fetchDashboardStats } from "./apiClient";

interface Coverage {
  creators: number;
  cities: number;
  categories: number;
}

// Independent of Dashboard.tsx's own fetch — SideRail renders on every
// route, so it needs its own small pull rather than a shared context for
// one stat block. One extra cheap request on navigation is an acceptable
// tradeoff for not introducing a new provider.
export function useCoverageStat(): Coverage | null {
  const [coverage, setCoverage] = useState<Coverage | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then((stats) => setCoverage(stats.coverage))
      .catch(() => {});
  }, []);

  return coverage;
}
