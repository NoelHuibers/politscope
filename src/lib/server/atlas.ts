import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import topicKeywordsJson from "@/data/topic-keywords.json";
import { db } from "@/lib/db";

export type AtlasPoint = {
  id: string;
  /** UMAP-projected x, normalized to [-1, 1]. */
  x: number;
  /** UMAP-projected y, normalized to [-1, 1]. */
  y: number;
  party: string;
  /** Cluster id from #51, e.g. "cluster-3"; null if no clustering done yet. */
  topicId: string | null;
  /** Speaker display name; null if the speech has no matched MP. */
  mpName: string | null;
  /** ISO session date — used by the hover tooltip. */
  sessionDate: string;
};

export type AtlasCluster = {
  topicId: string;
  /** Centroid in normalized [-1, 1] atlas space. */
  cx: number;
  cy: number;
  size: number;
  /** Top-N keywords from c-TF-IDF; shown as the on-atlas label. */
  keywords: string[];
};

export type AtlasResponse = {
  points: AtlasPoint[];
  clusters: AtlasCluster[];
  /** Total speeches in the DB (including those without embeddings yet). */
  total: number;
  /** Speeches that have a UMAP projection AND match the active filters. */
  projected: number;
};

type TopicKeywordEntry = { word: string; score: number; count: number };
type TopicKeywordsFile = {
  generatedAt: string;
  k: number;
  numSpeeches: number;
  clusters: Record<string, TopicKeywordEntry[]>;
};
const TOPIC_KEYWORDS = topicKeywordsJson as TopicKeywordsFile;

export type AtlasFilters = {
  /** Restrict to these party enum values. undefined = no party filter. */
  parties?: string[];
  /** Restrict to this Wahlperiode. undefined = all Wahlperioden. */
  wahlperiode?: number;
  /** Restrict to one cluster (e.g. "cluster-3"). undefined = all topics. */
  topic?: string;
};

/**
 * Atlas points server function with optional party / wahlperiode filters.
 *
 * Normalisation: x/y are min/max-scaled to [-1, 1] over the FILTERED result set
 * — so when you filter to AfD-only, the AfD subcloud fills the viewport instead
 * of being squished into a corner. If we ever want absolute-coords-stable
 * filtering for cross-filter comparisons, that's a follow-up.
 */
export const getAtlasPoints = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): AtlasFilters => {
    if (input === null || input === undefined) return {};
    if (typeof input !== "object") return {};
    const obj = input as { parties?: unknown; wahlperiode?: unknown; topic?: unknown };
    // `parties === undefined` means "no party filter"; `parties === []` means
    // "filter to no parties → expect zero results". Preserve the distinction.
    const parties =
      Array.isArray(obj.parties) && obj.parties.every((p) => typeof p === "string")
        ? (obj.parties as string[])
        : undefined;
    const wahlperiode =
      typeof obj.wahlperiode === "number" && Number.isFinite(obj.wahlperiode)
        ? Math.floor(obj.wahlperiode)
        : undefined;
    const topic = typeof obj.topic === "string" && obj.topic.length > 0 ? obj.topic : undefined;
    return { parties, wahlperiode, topic };
  })
  .handler(async ({ data }): Promise<AtlasResponse> => {
    // parties === undefined → no filter; parties === [] → match nothing; parties === [...] → match those.
    const partyFilterSql =
      data.parties === undefined ? sql`` : sql`AND m.party::text = ANY(${data.parties}::text[])`;
    const wpFilterSql =
      data.wahlperiode === undefined ? sql`` : sql`AND se.wahlperiode = ${data.wahlperiode}`;
    const topicFilterSql = data.topic === undefined ? sql`` : sql`AND s.topic_id = ${data.topic}`;

    const projected = await db.execute<{
      id: string;
      umap_x: number;
      umap_y: number;
      party: string;
      topic_id: string | null;
      mp_name: string | null;
      session_date: string;
    }>(sql`
      SELECT s.id::text AS id, s.umap_x, s.umap_y, m.party::text AS party, s.topic_id,
             m.name AS mp_name, se.date::text AS session_date
      FROM speeches s
      LEFT JOIN mps m ON s.mp_id = m.id
      LEFT JOIN sessions se ON s.session_id = se.id
      WHERE s.umap_x IS NOT NULL AND s.umap_y IS NOT NULL AND m.party IS NOT NULL
      ${partyFilterSql}
      ${wpFilterSql}
      ${topicFilterSql}
    `);

    const totalResult = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM speeches`,
    );

    if (projected.rows.length === 0) {
      return {
        points: [],
        clusters: [],
        total: Number(totalResult.rows[0]?.count ?? 0),
        projected: 0,
      };
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const row of projected.rows) {
      if (row.umap_x < minX) minX = row.umap_x;
      if (row.umap_x > maxX) maxX = row.umap_x;
      if (row.umap_y < minY) minY = row.umap_y;
      if (row.umap_y > maxY) maxY = row.umap_y;
    }
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const points: AtlasPoint[] = projected.rows.map((row) => ({
      id: row.id,
      x: ((row.umap_x - minX) / spanX) * 2 - 1,
      y: ((row.umap_y - minY) / spanY) * 2 - 1,
      party: row.party,
      topicId: row.topic_id,
      mpName: row.mp_name,
      sessionDate: row.session_date,
    }));

    // Compute centroid per topic_id, then attach top-3 keywords from the
    // checked-in JSON produced by scripts/tracer-cluster.ts.
    const byTopic = new Map<string, AtlasPoint[]>();
    for (const p of points) {
      if (!p.topicId) continue;
      const arr = byTopic.get(p.topicId) ?? [];
      arr.push(p);
      byTopic.set(p.topicId, arr);
    }
    const clusters: AtlasCluster[] = [];
    for (const [topicId, pts] of byTopic) {
      const cx = pts.reduce((acc, p) => acc + p.x, 0) / pts.length;
      const cy = pts.reduce((acc, p) => acc + p.y, 0) / pts.length;
      const keywords =
        (TOPIC_KEYWORDS.clusters[topicId] ?? []).slice(0, 3).map((k) => k.word) ?? [];
      clusters.push({ topicId, cx, cy, size: pts.length, keywords });
    }
    clusters.sort((a, b) => b.size - a.size);

    return {
      points,
      clusters,
      total: Number(totalResult.rows[0]?.count ?? 0),
      projected: points.length,
    };
  });
