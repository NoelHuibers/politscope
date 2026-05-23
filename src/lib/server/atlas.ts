import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type AtlasPoint = {
  id: string;
  /** UMAP-projected x, normalized to [-1, 1]. */
  x: number;
  /** UMAP-projected y, normalized to [-1, 1]. */
  y: number;
  party: string;
};

export type AtlasResponse = {
  points: AtlasPoint[];
  /** Total speeches in the DB (including those without embeddings yet). */
  total: number;
  /** Speeches that have a UMAP projection (i.e., would be rendered). */
  projected: number;
};

/**
 * Tracer-bullet atlas endpoint: returns every speech that has UMAP coords + a known party.
 *
 * Naive impl — no pagination, no filtering, no caching. Replaced by the real
 * paginated version in #25. Acceptable here because the tracer dataset is
 * ~174 points; #45 explicitly accepts that.
 *
 * Server-only: the import of `db` ties this file to Neon. Vite's tree-shaking
 * (via the `createServerFn` factory) keeps it out of the client bundle.
 */
export const getAtlasPoints = createServerFn({ method: "GET" }).handler(
  async (): Promise<AtlasResponse> => {
    const projected = await db.execute<{
      id: string;
      umap_x: number;
      umap_y: number;
      party: string;
    }>(sql`
      SELECT s.id::text AS id, s.umap_x, s.umap_y, m.party::text AS party
      FROM speeches s
      LEFT JOIN mps m ON s.mp_id = m.id
      WHERE s.umap_x IS NOT NULL AND s.umap_y IS NOT NULL AND m.party IS NOT NULL
    `);

    const totalResult = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM speeches`,
    );

    // Find min/max for normalization to [-1, 1].
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
    }));

    return {
      points,
      total: Number(totalResult.rows[0]?.count ?? 0),
      projected: points.length,
    };
  },
);
