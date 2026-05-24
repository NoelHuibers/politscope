import { useQuery } from "@tanstack/react-query";
import { type CorpusStats, getCorpusStats } from "@/lib/server/stats";

/**
 * Returns aggregate corpus stats from the DB. Components share the cache
 * via a stable query key — the actual fetch happens at most once per page load.
 */
export function useCorpusStats() {
  return useQuery<CorpusStats>({
    queryKey: ["corpus-stats"],
    queryFn: () => getCorpusStats(),
  });
}

/** German thin-space-grouped number, matching the mockup's "1 248 318" style. */
export function formatGerman(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("de-DE").replace(/\./g, " ");
}
