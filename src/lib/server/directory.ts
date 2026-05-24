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

export type MpPhoto = {
  /** Commons Special:FilePath URL — append ?width=N for sized variants. */
  url: string;
  attribution: string | null;
  attributionUrl: string | null;
  license: string | null;
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
  photo: MpPhoto | null;
};

export type RecentSession = {
  id: string;
  wahlperiode: number;
  sitzung: number;
  date: string;
  speechCount: number;
};

export type SpeechListRow = {
  id: string;
  top: number | null;
  wordCount: number;
  /** First ~140 chars of the speech, no trailing ellipsis. */
  preview: string;
  sessionDate: string;
  wahlperiode: number;
  sitzung: number;
  mp: { extId: string; name: string; party: string } | null;
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
      photo_url: string | null;
      photo_attribution: string | null;
      photo_attribution_url: string | null;
      photo_license: string | null;
    }>(sql`
      SELECT m.id::text AS id, m.ext_id, m.name, m.party::text AS party, m.role, m.since,
             m.photo_url, m.photo_attribution, m.photo_attribution_url, m.photo_license,
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
      photo: row.photo_url
        ? {
            url: row.photo_url,
            attribution: row.photo_attribution,
            attributionUrl: row.photo_attribution_url,
            license: row.photo_license,
          }
        : null,
    };
  });

/** Full table of MPs with speech counts. Used by the directory page. */
export const getAllMps = createServerFn({ method: "GET" }).handler(async (): Promise<TopMp[]> => {
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
    ORDER BY m.name
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

/** Speeches authored by one MP (by extId), most recent first. */
export const getSpeechesByMp = createServerFn({ method: "GET" })
  .inputValidator((extId: unknown): { extId: string } => {
    if (typeof extId !== "string" || extId.length === 0) {
      throw new Error("extId must be a non-empty string");
    }
    return { extId };
  })
  .handler(async ({ data }): Promise<SpeechListRow[]> => {
    const result = await db.execute<{
      id: string;
      top: number | null;
      word_count: number;
      preview: string;
      session_date: string;
      wahlperiode: number;
      sitzung: number;
      mp_ext_id: string;
      mp_name: string;
      mp_party: string;
    }>(sql`
      SELECT s.id::text AS id, s.top, s.word_count,
             substring(s.text, 1, 160) AS preview,
             se.date::text AS session_date, se.wahlperiode, se.sitzung,
             m.ext_id AS mp_ext_id, m.name AS mp_name, m.party::text AS mp_party
      FROM speeches s
      JOIN sessions se ON s.session_id = se.id
      JOIN mps m ON s.mp_id = m.id
      WHERE m.ext_id = ${data.extId}
      ORDER BY se.date DESC, s.top ASC NULLS LAST
    `);

    return result.rows.map((row) => ({
      id: row.id,
      top: row.top,
      wordCount: row.word_count,
      preview: row.preview,
      sessionDate: row.session_date,
      wahlperiode: row.wahlperiode,
      sitzung: row.sitzung,
      mp: { extId: row.mp_ext_id, name: row.mp_name, party: row.mp_party },
    }));
  });

/** All speeches in one session, in TOP order. */
export const getSpeechesBySession = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { wahlperiode: number; sitzung: number } => {
    if (input === null || typeof input !== "object") {
      throw new Error("expected { wahlperiode, sitzung }");
    }
    const obj = input as { wahlperiode?: unknown; sitzung?: unknown };
    if (typeof obj.wahlperiode !== "number" || typeof obj.sitzung !== "number") {
      throw new Error("wahlperiode and sitzung must be numbers");
    }
    return { wahlperiode: Math.floor(obj.wahlperiode), sitzung: Math.floor(obj.sitzung) };
  })
  .handler(async ({ data }): Promise<SpeechListRow[]> => {
    const result = await db.execute<{
      id: string;
      top: number | null;
      word_count: number;
      preview: string;
      session_date: string;
      wahlperiode: number;
      sitzung: number;
      mp_ext_id: string | null;
      mp_name: string | null;
      mp_party: string | null;
    }>(sql`
      SELECT s.id::text AS id, s.top, s.word_count,
             substring(s.text, 1, 160) AS preview,
             se.date::text AS session_date, se.wahlperiode, se.sitzung,
             m.ext_id AS mp_ext_id, m.name AS mp_name, m.party::text AS mp_party
      FROM speeches s
      JOIN sessions se ON s.session_id = se.id
      LEFT JOIN mps m ON s.mp_id = m.id
      WHERE se.wahlperiode = ${data.wahlperiode} AND se.sitzung = ${data.sitzung}
      ORDER BY s.top ASC NULLS LAST, s.created_at ASC
    `);

    return result.rows.map((row) => ({
      id: row.id,
      top: row.top,
      wordCount: row.word_count,
      preview: row.preview,
      sessionDate: row.session_date,
      wahlperiode: row.wahlperiode,
      sitzung: row.sitzung,
      mp:
        row.mp_ext_id && row.mp_name && row.mp_party
          ? { extId: row.mp_ext_id, name: row.mp_name, party: row.mp_party }
          : null,
    }));
  });

/** All sessions, most recent first. */
export const getAllSessions = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecentSession[]> => {
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
    `);

    return result.rows.map((row) => ({
      id: row.id,
      wahlperiode: row.wahlperiode,
      sitzung: row.sitzung,
      date: row.date,
      speechCount: Number(row.speech_count),
    }));
  },
);

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
