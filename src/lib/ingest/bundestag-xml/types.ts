/**
 * Output records from the Bundestag XML parser.
 *
 * These mirror the Drizzle schema in src/lib/db/schema.ts but use external
 * references (wahlperiode+sitzung composite, Bundestag MP extId) instead of
 * generated UUIDs and FKs. The DB writer (see #14) resolves these to UUIDs
 * during bulk insert.
 */

/** One plenary session — typically one XML file. */
export type SessionRecord = {
  wahlperiode: number;
  /** Session number within the Wahlperiode. */
  sitzung: number;
  /** ISO 8601 date, YYYY-MM-DD. */
  date: string;
};

/**
 * Raw MP record as it appears in protocol XML. The CDU/CSU split, party
 * normalization, and Stammdaten enrichment (Wahlkreis, since-year, etc.)
 * happen in the identity layer (#13).
 */
export type MpRawRecord = {
  /** Bundestag's stable internal MP id (e.g. "11003001") — from redner@id. */
  extId: string;
  /** Assembled display name: "Dr. Klaus Schmidt". */
  name: string;
  /** Raw Fraktion text as it appears in XML, e.g. "CDU/CSU", "BÜNDNIS 90/DIE GRÜNEN". */
  rawFactionName: string;
  /** Optional role text, e.g. "Bundesminister für Verkehr". null if none. */
  role: string | null;
};

/**
 * One speech (Rede) — the atomic unit for embeddings + FTS. Excludes all
 * interjections (<kommentar>) per #9. Text is cleaned conservatively:
 * paragraphs joined with double-newline, whitespace collapsed.
 */
export type SpeechRecord = {
  /** Composite reference to the parent session (parser doesn't know UUIDs). */
  session: { wahlperiode: number; sitzung: number };
  /** Reference to the MP by Bundestag extId. null if the speaker couldn't be resolved. */
  mpExtId: string | null;
  /** Tagesordnungspunkt number, e.g. 5. null if outside any TOP (rare). */
  top: number | null;
  /** Word count of the cleaned text (kommentar excluded). */
  wordCount: number;
  /** Cleaned speech text. */
  text: string;
};
