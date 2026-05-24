import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { GERMAN_STOPWORDS, MIN_WORD_LENGTH } from "@/data/stopwords-de";
import { db } from "@/lib/db";

export type DistinctivePhrase = {
  phrase: string;
  weight: number;
  count: number;
};

/** Min number of speeches an MP must have for statistically-meaningful results. */
const MIN_SPEECHES = 3;
/** Min occurrence threshold per phrase in the MP's corpus. */
const MIN_COUNT_IN_MP = 3;
/** Dirichlet prior — weak smoothing. */
const ALPHA = 0.5;
/** How many top phrases to return. */
const TOP_K = 12;

/**
 * Per-MP distinctive phrases via log-odds-ratio with informative Dirichlet
 * prior (Monroe, Colaresi & Quinn 2008). Compares the MP's combined speeches
 * against the rest of the corpus and surfaces statistically distinctive
 * unigrams the MP uses more than average.
 *
 * Returns `[]` if the MP has fewer than MIN_SPEECHES speeches — the caller
 * should render an "insufficient data" state in that case.
 *
 * Implementation note: compute in-memory after fetching two text columns.
 * At full-corpus scale (~600k speeches) this becomes prohibitive per request;
 * we'd materialize a `mp_top_phrases` table refreshed nightly (see #28).
 */
export const getMpDistinctivePhrases = createServerFn({ method: "GET" })
  .inputValidator((extId: unknown): { extId: string } => {
    if (typeof extId !== "string" || extId.length === 0) {
      throw new Error("extId must be a non-empty string");
    }
    return { extId };
  })
  .handler(async ({ data }): Promise<DistinctivePhrase[]> => {
    // MP's own corpus + their name (to strip from results).
    const mpResult = await db.execute<{ text: string; name: string }>(sql`
      SELECT s.text, m.name
      FROM speeches s
      JOIN mps m ON s.mp_id = m.id
      WHERE m.ext_id = ${data.extId}
    `);

    if (mpResult.rows.length < MIN_SPEECHES) return [];
    const mpName = mpResult.rows[0]?.name ?? "";
    const mpText = mpResult.rows.map((r) => r.text).join("\n");

    // Rest of corpus (everything NOT by this MP).
    const restResult = await db.execute<{ text: string }>(sql`
      SELECT s.text
      FROM speeches s
      LEFT JOIN mps m ON s.mp_id = m.id
      WHERE m.ext_id IS NULL OR m.ext_id <> ${data.extId}
    `);
    const restText = restResult.rows.map((r) => r.text).join("\n");

    // Build name tokens we want to exclude.
    const nameTokens = new Set(tokenize(mpName).map((t) => t.toLowerCase()));

    const mpCounts = countTokens(mpText, nameTokens);
    const restCounts = countTokens(restText, nameTokens);

    const mpTotal = sumValues(mpCounts);
    const restTotal = sumValues(restCounts);

    if (mpTotal === 0 || restTotal === 0) return [];

    const results: DistinctivePhrase[] = [];
    for (const [phrase, mpCount] of mpCounts) {
      if (mpCount < MIN_COUNT_IN_MP) continue;
      const restCount = restCounts.get(phrase) ?? 0;
      const logMp = Math.log((mpCount + ALPHA) / (mpTotal - mpCount + ALPHA));
      const logRest = Math.log((restCount + ALPHA) / (restTotal - restCount + ALPHA));
      const delta = logMp - logRest;
      const variance = 1 / (mpCount + ALPHA) + 1 / (restCount + ALPHA);
      const z = delta / Math.sqrt(variance);
      if (z <= 0) continue;
      results.push({ phrase, weight: z, count: mpCount });
    }

    results.sort((a, b) => b.weight - a.weight);
    return results.slice(0, TOP_K);
  });

// ---------- internal helpers ----------

function tokenize(input: string): string[] {
  // Word boundaries that preserve German diacritics (ä ö ü ß) and remove
  // numbers, punctuation, and bracketed content. Multi-line input is OK.
  return input
    .toLowerCase()
    .split(/[^a-zäöüßÀ-ɏ]+/u)
    .filter((w) => w.length >= MIN_WORD_LENGTH);
}

function countTokens(text: string, extraSkip: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (GERMAN_STOPWORDS.has(token)) continue;
    if (extraSkip.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function sumValues(m: Map<string, number>): number {
  let sum = 0;
  for (const v of m.values()) sum += v;
  return sum;
}
