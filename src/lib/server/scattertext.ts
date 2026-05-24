import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { GERMAN_STOPWORDS, MIN_WORD_LENGTH } from "@/data/stopwords-de";
import { db } from "@/lib/db";

export type ScatterWord = {
  word: string;
  /** Axis position [-1, +1] — +1 = strongly partyA, -1 = strongly partyB. */
  x: number;
  /** Log-frequency [0, 1] used for vertical positioning + font size. */
  f: number;
  /** Raw counts for the tooltip. */
  countA: number;
  countB: number;
  /** Total occurrences across both parties. */
  totalCount: number;
};

export type ScattertextResponse = {
  words: ScatterWord[];
  partyA: string;
  partyB: string;
  topic: string | null;
  totalA: number;
  totalB: number;
};

const ALPHA = 0.5;
const MIN_COUNT = 2;
const TOP_K = 60;

type RawRow = { party: string; text: string };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zäöüßÀ-ɏ]+/u)
    .filter((w) => w.length >= MIN_WORD_LENGTH && !GERMAN_STOPWORDS.has(w));
}

/** Pure computation — testable without the Start runtime. */
export function computeScattertext(
  rows: RawRow[],
  partyA: string,
  partyB: string,
  topic: string | null,
): ScattertextResponse {
  const countsA = new Map<string, number>();
  const countsB = new Map<string, number>();
  let totalA = 0;
  let totalB = 0;

  for (const row of rows) {
    const target = row.party === partyA ? countsA : row.party === partyB ? countsB : null;
    if (!target) continue;
    for (const tok of tokenize(row.text)) {
      target.set(tok, (target.get(tok) ?? 0) + 1);
      if (target === countsA) totalA += 1;
      else totalB += 1;
    }
  }

  if (totalA === 0 || totalB === 0) {
    return { words: [], partyA, partyB, topic, totalA, totalB };
  }

  const words = new Set([...countsA.keys(), ...countsB.keys()]);
  const scored: ScatterWord[] = [];
  for (const word of words) {
    const a = countsA.get(word) ?? 0;
    const b = countsB.get(word) ?? 0;
    if (a + b < MIN_COUNT) continue;
    const logA = Math.log((a + ALPHA) / (totalA - a + ALPHA));
    const logB = Math.log((b + ALPHA) / (totalB - b + ALPHA));
    const delta = logA - logB;
    const variance = 1 / (a + ALPHA) + 1 / (b + ALPHA);
    const z = delta / Math.sqrt(variance);
    scored.push({
      word,
      x: z,
      f: Math.log(a + b + 1),
      countA: a,
      countB: b,
      totalCount: a + b,
    });
  }

  // Normalise x to [-1, +1] and f to [0, 1] using max absolute / max value.
  const maxX = Math.max(...scored.map((s) => Math.abs(s.x))) || 1;
  const maxF = Math.max(...scored.map((s) => s.f)) || 1;
  for (const s of scored) {
    s.x = (s.x / maxX) * 0.95;
    s.f = (s.f / maxF) * 0.92;
  }

  // Keep the top K words by |x| × f (strongly opinionated + reasonably frequent).
  scored.sort((a, b) => Math.abs(b.x) * b.f - Math.abs(a.x) * a.f);

  return {
    words: scored.slice(0, TOP_K),
    partyA,
    partyB,
    topic,
    totalA,
    totalB,
  };
}

export const getScattertext = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { topic: string | null; partyA: string; partyB: string } => {
    if (typeof input !== "object" || input === null) {
      return { topic: null, partyA: "afd", partyB: "grn" };
    }
    const obj = input as { topic?: unknown; partyA?: unknown; partyB?: unknown };
    const topic = typeof obj.topic === "string" && obj.topic.length > 0 ? obj.topic : null;
    const partyA = typeof obj.partyA === "string" && obj.partyA.length > 0 ? obj.partyA : "afd";
    const partyB = typeof obj.partyB === "string" && obj.partyB.length > 0 ? obj.partyB : "grn";
    return { topic, partyA, partyB };
  })
  .handler(async ({ data }): Promise<ScattertextResponse> => {
    const topicFilter = data.topic === null ? sql`` : sql`AND s.topic_id = ${data.topic}`;
    const rows = await db.execute<RawRow>(sql`
      SELECT m.party::text AS party, s.text
      FROM speeches s
      JOIN mps m ON s.mp_id = m.id
      WHERE (m.party::text = ${data.partyA} OR m.party::text = ${data.partyB})
      ${topicFilter}
    `);
    return computeScattertext(rows.rows, data.partyA, data.partyB, data.topic);
  });
