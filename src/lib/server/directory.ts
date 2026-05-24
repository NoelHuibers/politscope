import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type TopMp = {
  id: string;
  extId: string;
  name: string;
  party: string;
  role: string | null;
  speechCount: number;
};

export type MpProfile = {
  id: string;
  extId: string;
  name: string;
  party: string;
  role: string | null;
  since: number | null;
  totalSpeeches: number;
  firstSpeechDate: string | null;
  lastSpeechDate: string | null;
};

export type RecentSession = {
  id: string;
  wahlperiode: number;
  sitzung: number;
  date: string;
  speechCount: number;
};

/** Top-N MPs by speech count across the entire corpus. */
export const getTopMps = createServerFn({ method: "GET" })
  .inputValidator((limit: unknown): { limit: number } => ({
    limit: typeof limit === "number" && limit > 0 && limit <= 100 ? Math.floor(limit) : 8,
  }))
  .handler(async ({ data }): Promise<TopMp[]> => {
    const result = await db.execute<{
      id: string;
      ext_id: string;
      name: string;
      party: string;
      role: string | null;
      speech_count: string;
    }>(sql`
      SELECT m.id::text AS id, m.ext_id, m.name, m.party::text AS party, m.role,
             count(s.id)::text AS speech_count
      FROM mps m
      LEFT JOIN speeches s ON s.mp_id = m.id
      GROUP BY m.id
      ORDER BY count(s.id) DESC, m.name
      LIMIT ${data.limit}
    `);

    return result.rows.map((row) => ({
      id: row.id,
      extId: row.ext_id,
      name: row.name,
      party: row.party,
      role: row.role,
      speechCount: Number(row.speech_count),
    }));
  });

/** Profile for one MP by Bundestag extId, with derived speech stats. */
export const getMpByExtId = createServerFn({ method: "GET" })
  .inputValidator((extId: unknown): { extId: string } => {
    if (typeof extId !== "string" || extId.length === 0) {
      throw new Error("extId must be a non-empty string");
    }
    return { extId };
  })
  .handler(async ({ data }): Promise<MpProfile | null> => {
    const result = await db.execute<{
      id: string;
      ext_id: string;
      name: string;
      party: string;
      role: string | null;
      since: number | null;
      total_speeches: string;
      first_date: string | null;
      last_date: string | null;
    }>(sql`
      SELECT m.id::text AS id, m.ext_id, m.name, m.party::text AS party, m.role, m.since,
             count(s.id)::text AS total_speeches,
             min(se.date)::text AS first_date,
             max(se.date)::text AS last_date
      FROM mps m
      LEFT JOIN speeches s ON s.mp_id = m.id
      LEFT JOIN sessions se ON s.session_id = se.id
      WHERE m.ext_id = ${data.extId}
      GROUP BY m.id
      LIMIT 1
    `);

    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      extId: row.ext_id,
      name: row.name,
      party: row.party,
      role: row.role,
      since: row.since,
      totalSpeeches: Number(row.total_speeches),
      firstSpeechDate: row.first_date,
      lastSpeechDate: row.last_date,
    };
  });

/** Most recent N sessions by date — used by BottomStrip "recent debates". */
export const getRecentSessions = createServerFn({ method: "GET" })
  .inputValidator((limit: unknown): { limit: number } => ({
    limit: typeof limit === "number" && limit > 0 && limit <= 50 ? Math.floor(limit) : 4,
  }))
  .handler(async ({ data }): Promise<RecentSession[]> => {
    const result = await db.execute<{
      id: string;
      wahlperiode: number;
      sitzung: number;
      date: string;
      speech_count: string;
    }>(sql`
      SELECT se.id::text AS id, se.wahlperiode, se.sitzung, se.date::text AS date,
             count(s.id)::text AS speech_count
      FROM sessions se
      LEFT JOIN speeches s ON s.session_id = se.id
      GROUP BY se.id
      ORDER BY se.date DESC, se.sitzung DESC
      LIMIT ${data.limit}
    `);

    return result.rows.map((row) => ({
      id: row.id,
      wahlperiode: row.wahlperiode,
      sitzung: row.sitzung,
      date: row.date,
      speechCount: Number(row.speech_count),
    }));
  });
