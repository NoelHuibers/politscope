import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type SpeechDetail = {
  id: string;
  text: string;
  wordCount: number;
  top: number | null;
  sessionDate: string;
  wahlperiode: number;
  sitzung: number;
  mp: {
    extId: string;
    name: string;
    party: string;
    role: string | null;
  } | null;
};

/** Fetch one speech by id with parent session + speaker details. */
export const getSpeechById = createServerFn({ method: "GET" })
  .inputValidator((id: unknown): { id: string } => {
    if (typeof id !== "string" || id.length === 0) {
      throw new Error("id must be a non-empty string");
    }
    return { id };
  })
  .handler(async ({ data }): Promise<SpeechDetail | null> => {
    const result = await db.execute<{
      id: string;
      text: string;
      word_count: number;
      top: number | null;
      session_date: string;
      wahlperiode: number;
      sitzung: number;
      mp_ext_id: string | null;
      mp_name: string | null;
      mp_party: string | null;
      mp_role: string | null;
    }>(sql`
      SELECT s.id::text AS id, s.text, s.word_count, s.top,
             se.date::text AS session_date, se.wahlperiode, se.sitzung,
             m.ext_id AS mp_ext_id, m.name AS mp_name,
             m.party::text AS mp_party, m.role AS mp_role
      FROM speeches s
      JOIN sessions se ON s.session_id = se.id
      LEFT JOIN mps m ON s.mp_id = m.id
      WHERE s.id = ${data.id}::uuid
      LIMIT 1
    `);

    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      text: row.text,
      wordCount: row.word_count,
      top: row.top,
      sessionDate: row.session_date,
      wahlperiode: row.wahlperiode,
      sitzung: row.sitzung,
      mp:
        row.mp_ext_id && row.mp_name && row.mp_party
          ? {
              extId: row.mp_ext_id,
              name: row.mp_name,
              party: row.mp_party,
              role: row.mp_role,
            }
          : null,
    };
  });
