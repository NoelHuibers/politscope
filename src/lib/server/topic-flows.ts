import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import topicKeywordsJson from "@/data/topic-keywords.json";
import { db } from "@/lib/db";

export type TopicFlowPeriod = {
  /** Wahlperiode number, e.g. 19, 20, 21. */
  id: number;
  label: string;
  /** Total speech count in this period. */
  total: number;
};

export type TopicFlowBand = {
  /** e.g. "cluster-3". */
  topicId: string;
  /** Short label derived from top c-TF-IDF keywords. */
  label: string;
  /** Speech count per period, in the same order as `periods`. */
  counts: number[];
  /** Total across all periods (for ordering). */
  total: number;
};

export type TopicFlowsResponse = {
  periods: TopicFlowPeriod[];
  bands: TopicFlowBand[];
};

type TopicKeywordEntry = { word: string; score: number; count: number };
type TopicKeywordsFile = {
  generatedAt: string;
  k: number;
  numSpeeches: number;
  clusters: Record<string, TopicKeywordEntry[]>;
};
const TOPIC_KEYWORDS = topicKeywordsJson as TopicKeywordsFile;

function labelFor(topicId: string): string {
  const top = TOPIC_KEYWORDS.clusters[topicId]?.slice(0, 2) ?? [];
  if (top.length === 0) return topicId;
  return top.map((k) => k.word).join(" · ");
}

export const getTopicFlows = createServerFn({ method: "GET" }).handler(
  async (): Promise<TopicFlowsResponse> => {
    const rows = await db.execute<{
      wahlperiode: number;
      topic_id: string;
      n: number;
    }>(sql`
      SELECT s.wahlperiode, sp.topic_id, COUNT(*)::int AS n
      FROM speeches sp
      JOIN sessions s ON sp.session_id = s.id
      WHERE sp.topic_id IS NOT NULL
      GROUP BY s.wahlperiode, sp.topic_id
      ORDER BY s.wahlperiode, sp.topic_id
    `);

    const periodIds = Array.from(new Set(rows.rows.map((r) => r.wahlperiode))).sort(
      (a, b) => a - b,
    );
    const topicIds = Array.from(new Set(rows.rows.map((r) => r.topic_id))).sort();

    const periodIndex = new Map(periodIds.map((p, i) => [p, i]));
    const periodTotals = new Map<number, number>();
    const bandsMap = new Map<string, number[]>();
    for (const t of topicIds) bandsMap.set(t, new Array(periodIds.length).fill(0));

    for (const r of rows.rows) {
      const idx = periodIndex.get(r.wahlperiode);
      if (idx === undefined) continue;
      const arr = bandsMap.get(r.topic_id);
      if (arr) arr[idx] = r.n;
      periodTotals.set(r.wahlperiode, (periodTotals.get(r.wahlperiode) ?? 0) + r.n);
    }

    const periods: TopicFlowPeriod[] = periodIds.map((id) => ({
      id,
      label: `WP${id}`,
      total: periodTotals.get(id) ?? 0,
    }));

    const bands: TopicFlowBand[] = topicIds
      .map((topicId) => {
        const counts = bandsMap.get(topicId) ?? [];
        const total = counts.reduce((acc, v) => acc + v, 0);
        return { topicId, label: labelFor(topicId), counts, total };
      })
      .sort((a, b) => b.total - a.total);

    return { periods, bands };
  },
);
