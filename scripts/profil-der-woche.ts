#!/usr/bin/env -S npx tsx
/**
 * Pick the "Profil der Woche" — the MP whose vocabulary is most distinctively
 * different from the rest of the Bundestag, measured by the highest top-1
 * z-score from a log-odds-ratio + Dirichlet-prior pass per MP.
 *
 * Writes `src/data/profil-der-woche.json` for the dashboard to read at
 * build/render time. Re-run weekly (cron → #27 ops ticket).
 *
 * Usage:
 *   pnpm tsx scripts/profil-der-woche.ts
 */
import "dotenv/config";

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { sql } from "drizzle-orm";
import { GERMAN_STOPWORDS, MIN_WORD_LENGTH } from "../src/data/stopwords-de.js";
import { db } from "../src/lib/db/index.js";

const MIN_SPEECHES_PER_MP = 3;
const MIN_COUNT_PER_PHRASE = 3;
const ALPHA = 0.5;
const TOP_PHRASES = 3;

type SpeechRow = {
  mp_id: string;
  ext_id: string;
  name: string;
  party: string;
  role: string | null;
  text: string;
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-zäöüßÀ-ɏ]+/u)
    .filter((w) => w.length >= MIN_WORD_LENGTH && !GERMAN_STOPWORDS.has(w));
}

async function main(): Promise<void> {
  process.stdout.write(`Reading speeches + MP metadata ...\n`);
  const result = await db.execute<SpeechRow>(sql`
    SELECT m.id::text AS mp_id, m.ext_id, m.name, m.party::text AS party, m.role, s.text
    FROM speeches s
    JOIN mps m ON s.mp_id = m.id
    WHERE s.text IS NOT NULL AND s.text <> ''
  `);
  process.stdout.write(
    `  ${result.rows.length} speeches across ${new Set(result.rows.map((r) => r.mp_id)).size} MPs\n`,
  );

  // Group speeches by MP + build per-MP token counts + global token counts.
  const byMp = new Map<string, { meta: Omit<SpeechRow, "text">; speeches: string[] }>();
  for (const row of result.rows) {
    const entry = byMp.get(row.mp_id) ?? {
      meta: {
        mp_id: row.mp_id,
        ext_id: row.ext_id,
        name: row.name,
        party: row.party,
        role: row.role,
      },
      speeches: [],
    };
    entry.speeches.push(row.text);
    byMp.set(row.mp_id, entry);
  }

  // Pre-tokenize once per MP.
  const tokensByMp = new Map<string, Map<string, number>>();
  const globalCounts = new Map<string, number>();
  let globalTotal = 0;
  for (const [mpId, entry] of byMp) {
    const local = new Map<string, number>();
    let localTotal = 0;
    for (const speech of entry.speeches) {
      for (const tok of tokenize(speech)) {
        const skipName = entry.meta.name.toLowerCase().includes(tok);
        if (skipName) continue;
        local.set(tok, (local.get(tok) ?? 0) + 1);
        globalCounts.set(tok, (globalCounts.get(tok) ?? 0) + 1);
        localTotal += 1;
        globalTotal += 1;
      }
    }
    tokensByMp.set(mpId, local);
    // Store localTotal alongside meta — abuse the entry object since we own it.
    (entry as unknown as { localTotal: number }).localTotal = localTotal;
  }

  // Now for each MP, compute top-3 LOR-with-Dirichlet phrases against (global − their tokens).
  process.stdout.write(`Computing LOR for ${byMp.size} MPs ...\n`);
  let bestMp: {
    extId: string;
    name: string;
    party: string;
    role: string | null;
    phrases: { phrase: string; weight: number; count: number }[];
    reasonScore: number;
    speechCount: number;
  } | null = null;

  for (const [mpId, entry] of byMp) {
    if (entry.speeches.length < MIN_SPEECHES_PER_MP) continue;
    const localCounts = tokensByMp.get(mpId);
    if (!localCounts) continue;
    const localTotal = (entry as unknown as { localTotal: number }).localTotal;
    const restTotal = globalTotal - localTotal;

    const phrases: { phrase: string; weight: number; count: number }[] = [];
    for (const [phrase, mpCount] of localCounts) {
      if (mpCount < MIN_COUNT_PER_PHRASE) continue;
      const restCount = (globalCounts.get(phrase) ?? 0) - mpCount;
      const logMp = Math.log((mpCount + ALPHA) / (localTotal - mpCount + ALPHA));
      const logRest = Math.log((restCount + ALPHA) / (restTotal - restCount + ALPHA));
      const delta = logMp - logRest;
      const variance = 1 / (mpCount + ALPHA) + 1 / (restCount + ALPHA);
      const z = delta / Math.sqrt(variance);
      if (z <= 0) continue;
      phrases.push({ phrase, weight: z, count: mpCount });
    }
    phrases.sort((a, b) => b.weight - a.weight);
    const topZ = phrases[0]?.weight ?? 0;

    if (!bestMp || topZ > bestMp.reasonScore) {
      bestMp = {
        extId: entry.meta.ext_id,
        name: entry.meta.name,
        party: entry.meta.party,
        role: entry.meta.role,
        phrases: phrases.slice(0, TOP_PHRASES),
        reasonScore: topZ,
        speechCount: entry.speeches.length,
      };
    }
  }

  if (!bestMp) {
    process.stderr.write("No MP qualified — insufficient data.\n");
    process.exit(1);
  }

  process.stdout.write(`\n=== Profil der Woche ===\n`);
  process.stdout.write(`  ${bestMp.name} (${bestMp.party}, ${bestMp.speechCount} Reden)\n`);
  process.stdout.write(`  top z-score: ${bestMp.reasonScore.toFixed(2)}\n`);
  for (const p of bestMp.phrases) {
    process.stdout.write(`    ${p.phrase.padEnd(28)} z=${p.weight.toFixed(2)} ×${p.count}\n`);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    ...bestMp,
  };
  const jsonPath = join("src", "data", "profil-der-woche.json");
  writeFileSync(jsonPath, `${JSON.stringify(out, null, 2)}\n`, "utf-8");
  process.stdout.write(`\nWrote ${jsonPath}\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
