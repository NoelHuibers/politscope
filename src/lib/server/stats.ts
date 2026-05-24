import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type CorpusStats = {
  totalSpeeches: number;
  totalMps: number;
  totalSessions: number;
  /** ISO date of earliest session in the corpus. null if no sessions. */
  earliestDate: string | null;
  /** ISO date of latest session in the corpus. null if no sessions. */
  latestDate: string | null;
  /** Speeches added in the last 7 days (by sessions.date), for the "new this week" badge. */
  newThisWeek: number;
};

/**
 * Aggregate corpus statistics used by TopBar/LeftRail/EmbeddingMap to show
 * real numbers instead of mock placeholders. Cheap aggregate query, served
 * to every page — TanStack Query caches it per query-key for the session.
 */
export const getCorpusStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<CorpusStats> => {
    const [row] = (
      await db.execute<{
        total_speeches: string;
        total_mps: string;
        total_sessions: string;
        earliest_date: string | null;
        latest_date: string | null;
        new_this_week: string;
      }>(sql`
        SELECT
          (SELECT count(*)::text FROM speeches) AS total_speeches,
          (SELECT count(*)::text FROM mps) AS total_mps,
          (SELECT count(*)::text FROM sessions) AS total_sessions,
          (SELECT min(date)::text FROM sessions) AS earliest_date,
          (SELECT max(date)::text FROM sessions) AS latest_date,
          (SELECT count(*)::text
             FROM speeches s
             JOIN sessions se ON s.session_id = se.id
             WHERE se.date >= (CURRENT_DATE - INTERVAL '7 days')) AS new_this_week
      `)
    ).rows;

    return {
      totalSpeeches: Number(row?.total_speeches ?? 0),
      totalMps: Number(row?.total_mps ?? 0),
      totalSessions: Number(row?.total_sessions ?? 0),
      earliestDate: row?.earliest_date ?? null,
      latestDate: row?.latest_date ?? null,
      newThisWeek: Number(row?.new_this_week ?? 0),
    };
  },
);
