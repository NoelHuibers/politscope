import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type SearchHit = {
  speechId: string;
  snippet: string;
  sessionDate: string;
  wahlperiode: number;
  sitzung: number;
  rank: number;
  mp: {
    extId: string;
    name: string;
    party: string;
  } | null;
};

const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 12;

/**
 * Full-text speech search over the `german` text-search configuration.
 *
 * - Uses `plainto_tsquery('german', ...)` so users can paste raw German phrases
 *   without learning tsquery syntax. Multi-word queries become an AND.
 * - `ts_rank_cd` weights by proximity, which is what users perceive as "good match".
 * - `ts_headline` returns a snippet with the matched terms wrapped in <mark>.
 *   We use `<mark>...</mark>` so the client can render with dangerouslySetInnerHTML
 *   or post-process — for the cmdk list we treat as plain text and strip the tags.
 */
export const searchSpeeches = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { q: string; limit: number } => {
    if (input === null || input === undefined) {
      return { q: "", limit: DEFAULT_LIMIT };
    }
    if (typeof input === "string") {
      return { q: input, limit: DEFAULT_LIMIT };
    }
    if (typeof input === "object") {
      const obj = input as { q?: unknown; limit?: unknown };
      const q = typeof obj.q === "string" ? obj.q : "";
      const limit =
        typeof obj.limit === "number" && obj.limit > 0
          ? Math.min(Math.floor(obj.limit), MAX_LIMIT)
          : DEFAULT_LIMIT;
      return { q, limit };
    }
    return { q: "", limit: DEFAULT_LIMIT };
  })
  .handler(async ({ data }): Promise<SearchHit[]> => {
    const q = data.q.trim();
    if (q.length < 2) return [];

    const result = await db.execute<{
      id: string;
      snippet: string;
      session_date: string;
      wahlperiode: number;
      sitzung: number;
      rank: number;
      mp_ext_id: string | null;
      mp_name: string | null;
      mp_party: string | null;
    }>(sql`
      SELECT
        s.id::text AS id,
        ts_headline(
          'german',
          s.text,
          plainto_tsquery('german', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=24, MinWords=12, ShortWord=2, MaxFragments=2'
        ) AS snippet,
        se.date::text AS session_date,
        se.wahlperiode,
        se.sitzung,
        ts_rank_cd(to_tsvector('german', s.text), plainto_tsquery('german', ${q})) AS rank,
        m.ext_id AS mp_ext_id,
        m.name AS mp_name,
        m.party::text AS mp_party
      FROM speeches s
      JOIN sessions se ON s.session_id = se.id
      LEFT JOIN mps m ON s.mp_id = m.id
      WHERE to_tsvector('german', s.text) @@ plainto_tsquery('german', ${q})
      ORDER BY rank DESC, se.date DESC
      LIMIT ${data.limit}
    `);

    return result.rows.map((row) => ({
      speechId: row.id,
      snippet: row.snippet,
      sessionDate: row.session_date,
      wahlperiode: row.wahlperiode,
      sitzung: row.sitzung,
      rank: row.rank,
      mp:
        row.mp_ext_id && row.mp_name && row.mp_party
          ? { extId: row.mp_ext_id, name: row.mp_name, party: row.mp_party }
          : null,
    }));
  });
