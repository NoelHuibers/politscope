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
  /** Speeches that have a UMAP projection AND match the active filters. */
  projected: number;
};

export type AtlasFilters = {
  /** Restrict to these party enum values. undefined = no party filter. */
  parties?: string[];
  /** Restrict to this Wahlperiode. undefined = all Wahlperioden. */
  wahlperiode?: number;
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
    const obj = input as { parties?: unknown; wahlperiode?: unknown };
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
    return { parties, wahlperiode };
  })
  .handler(async ({ data }): Promise<AtlasResponse> => {
    // parties === undefined → no filter; parties === [] → match nothing; parties === [...] → match those.
    const partyFilterSql =
      data.parties === undefined ? sql`` : sql`AND m.party::text = ANY(${data.parties}::text[])`;
    const wpFilterSql =
      data.wahlperiode === undefined ? sql`` : sql`AND se.wahlperiode = ${data.wahlperiode}`;

    const projected = await db.execute<{
      id: string;
      umap_x: number;
      umap_y: number;
      party: string;
    }>(sql`
      SELECT s.id::text AS id, s.umap_x, s.umap_y, m.party::text AS party
      FROM speeches s
      LEFT JOIN mps m ON s.mp_id = m.id
      LEFT JOIN sessions se ON s.session_id = se.id
      WHERE s.umap_x IS NOT NULL AND s.umap_y IS NOT NULL AND m.party IS NOT NULL
      ${partyFilterSql}
      ${wpFilterSql}
    `);

    const totalResult = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM speeches`,
    );

    if (projected.rows.length === 0) {
      return {
        points: [],
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
    }));

    return {
      points,
      total: Number(totalResult.rows[0]?.count ?? 0),
      projected: points.length,
    };
  });
