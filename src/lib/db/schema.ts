import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Bundestag fraktion / partei. Mirrors `src/data/parties.ts` PartyId.
 * Stored as enum for tight FKs and predictable indexes.
 */
export const partyEnum = pgEnum("party", [
  "cdu",
  "spd",
  "grn",
  "fdp",
  "lnk",
  "afd",
  "csu",
  "bsw",
  "none",
]);

/** A Member of Parliament (MdB) — historical and current. */
export const mps = pgTable(
  "mps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stable external id (Bundestag MdB id) */
    extId: text("ext_id").notNull(),
    name: text("name").notNull(),
    party: partyEnum("party").notNull(),
    role: text("role"),
    since: smallint("since"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("mps_ext_id_idx").on(t.extId)],
);

/** A plenary session (Sitzung). Multiple speeches per session. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Wahlperiode 12..21+ */
    wahlperiode: smallint("wahlperiode").notNull(),
    /** Sitzungsnummer within the Wahlperiode */
    sitzung: smallint("sitzung").notNull(),
    date: date("date").notNull(),
  },
  (t) => [
    uniqueIndex("sessions_wp_sitzung_idx").on(t.wahlperiode, t.sitzung),
    index("sessions_date_idx").on(t.date),
  ],
);

/** A single speech (Rede). The atomic unit for embeddings + FTS. */
export const speeches = pgTable(
  "speeches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => sessions.id)
      .notNull(),
    mpId: uuid("mp_id").references(() => mps.id),
    /** Tagesordnungspunkt */
    top: smallint("top"),
    /** Word count, useful for normalizing rhetorical metrics */
    wordCount: integer("word_count").notNull(),
    /** Plain text (after cleanup) */
    text: text("text").notNull(),
    /** Coarse topic id (matches src/data/topics.ts when classified) */
    topicId: text("topic_id"),
    /** UMAP-projected coordinate, normalized to -1..1 — for atlas rendering */
    umapX: integer("umap_x"),
    umapY: integer("umap_y"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("speeches_session_idx").on(t.sessionId),
    index("speeches_mp_idx").on(t.mpId),
    index("speeches_topic_idx").on(t.topicId),
    /** German full-text search index for Cmd+K speech lookup */
    index("speeches_fts_idx").using("gin", sql`to_tsvector('german', ${t.text})`),
  ],
);

/**
 * Speech embeddings. 1536-dim default (OpenAI text-embedding-3-small);
 * adjust dimension when the embedding-model decision is finalized.
 */
export const speechEmbeddings = pgTable(
  "speech_embeddings",
  {
    speechId: uuid("speech_id")
      .primaryKey()
      .references(() => speeches.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    /** Embedding model identifier — supports multi-model A/B */
    model: text("model").notNull(),
  },
  (t) => [
    /** HNSW for fast cosine kNN — atlas search and "more like this" */
    index("speech_embeddings_hnsw_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

export type MP = typeof mps.$inferSelect;
export type NewMP = typeof mps.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Speech = typeof speeches.$inferSelect;
export type SpeechEmbedding = typeof speechEmbeddings.$inferSelect;
