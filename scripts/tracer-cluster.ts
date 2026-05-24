#!/usr/bin/env -S npx tsx
/**
 * Tracer-bullet topic clustering (#51): k-means over the 1536-D OpenAI
 * embeddings to see whether semantically-coherent groups emerge at our
 * 174-speech scale. Writes `speeches.topic_id` and produces a
 * `src/data/topic-keywords.json` mapping cluster_id → top keywords
 * (computed via c-TF-IDF against the rest of the corpus).
 *
 * Usage:
 *   pnpm tsx scripts/tracer-cluster.ts            # default k=8
 *   pnpm tsx scripts/tracer-cluster.ts --k 6
 */
import "dotenv/config";

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { sql } from "drizzle-orm";
import { kmeans } from "ml-kmeans";
import { GERMAN_STOPWORDS, MIN_WORD_LENGTH } from "../src/data/stopwords-de.js";
import { db } from "../src/lib/db/index.js";

function parseArgs(argv: string[]): { k: number; topWords: number } {
  let k = 8;
  let topWords = 8;
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--k" && args[i + 1]) {
      const v = Number.parseInt(args[i + 1] ?? "", 10);
      if (!Number.isNaN(v) && v >= 2 && v <= 20) k = v;
      i += 1;
    } else if (args[i] === "--top" && args[i + 1]) {
      const v = Number.parseInt(args[i + 1] ?? "", 10);
      if (!Number.isNaN(v) && v >= 3 && v <= 20) topWords = v;
      i += 1;
    }
  }
  return { k, topWords };
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-zäöüßÀ-ɏ]+/u)
    .filter((w) => w.length >= MIN_WORD_LENGTH && !GERMAN_STOPWORDS.has(w));
}

type Loaded = { ids: string[]; texts: string[]; vectors: number[][] };

async function loadEmbeddings(pageSize: number): Promise<Loaded> {
  const ids: string[] = [];
  const texts: string[] = [];
  const vectors: number[][] = [];

  for (let offset = 0; ; offset += pageSize) {
    const page = await db.execute<{ id: string; embedding: string; text: string }>(sql`
      SELECT s.id::text AS id, e.embedding::text AS embedding, s.text
      FROM speeches s
      JOIN speech_embeddings e ON e.speech_id = s.id
      ORDER BY s.id
      LIMIT ${pageSize} OFFSET ${offset}
    `);
    if (page.rows.length === 0) break;
    for (const row of page.rows) {
      ids.push(row.id);
      texts.push(row.text);
      vectors.push(
        row.embedding
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map(Number.parseFloat),
      );
    }
    process.stdout.write(`  loaded ${ids.length} so far ...\n`);
    if (page.rows.length < pageSize) break;
  }
  return { ids, texts, vectors };
}

type ScoredWord = { word: string; score: number; count: number };

function computeClusterKeywords(
  byCluster: Map<number, number[]>,
  texts: string[],
  topWords: number,
): Record<string, ScoredWord[]> {
  const clusterCounts = new Map<number, Map<string, number>>();
  const clusterTotals = new Map<number, number>();
  const globalDf = new Map<string, number>();

  for (const [cid, idxs] of byCluster) {
    const counts = new Map<string, number>();
    let total = 0;
    const seenThisCluster = new Set<string>();
    for (const i of idxs) {
      const text = texts[i];
      if (!text) continue;
      for (const tok of tokenize(text)) {
        counts.set(tok, (counts.get(tok) ?? 0) + 1);
        total += 1;
        if (!seenThisCluster.has(tok)) {
          seenThisCluster.add(tok);
          globalDf.set(tok, (globalDf.get(tok) ?? 0) + 1);
        }
      }
    }
    clusterCounts.set(cid, counts);
    clusterTotals.set(cid, total);
  }

  const numClusters = byCluster.size;
  const out: Record<string, ScoredWord[]> = {};
  for (const [cid, counts] of clusterCounts) {
    const total = clusterTotals.get(cid) ?? 0;
    if (total === 0) continue;
    const scored: ScoredWord[] = [];
    for (const [word, count] of counts) {
      if (count < 3) continue;
      const tf = count / total;
      const df = globalDf.get(word) ?? 1;
      const idf = Math.log(numClusters / df);
      scored.push({ word, score: tf * idf, count });
    }
    scored.sort((a, b) => b.score - a.score);
    out[`cluster-${cid}`] = scored.slice(0, topWords);
  }
  return out;
}

async function writeTopicIds(byTopic: Map<string, string[]>): Promise<number> {
  let written = 0;
  for (const [topic, list] of byTopic) {
    const literal = `{${list.join(",")}}`;
    await db.execute(
      sql`UPDATE speeches SET topic_id = ${topic} WHERE id = ANY(${literal}::uuid[])`,
    );
    written += list.length;
    process.stdout.write(`  ${topic}: ${list.length} rows\n`);
  }
  return written;
}

async function main(): Promise<void> {
  const { k, topWords } = parseArgs(process.argv);

  process.stdout.write(`Reading embeddings ...\n`);
  const { ids, texts, vectors } = await loadEmbeddings(500);

  if (ids.length < k + 1) {
    throw new Error(`Need at least ${k + 1} embedded speeches; got ${ids.length}`);
  }
  process.stdout.write(`  ${ids.length} speeches loaded\n`);

  process.stdout.write(`Running k-means (k=${k}, max-iter=200) ...\n`);
  const t0 = Date.now();
  // Mulberry32 PRNG seeded for reproducibility, same pattern as tracer-umap.
  let seed = 0x12345678;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = kmeans(vectors, k, {
    maxIterations: 200,
    initialization: "kmeans++",
    seed: Math.floor(random() * 2 ** 31),
  });
  process.stdout.write(
    `  done in ${Math.round((Date.now() - t0) / 1000)}s, iterations=${result.iterations}\n`,
  );

  // Group speech indices by cluster.
  const byCluster = new Map<number, number[]>();
  for (let i = 0; i < result.clusters.length; i += 1) {
    const c = result.clusters[i];
    if (c === undefined) continue;
    const list = byCluster.get(c) ?? [];
    list.push(i);
    byCluster.set(c, list);
  }

  process.stdout.write(`Computing c-TF-IDF top-${topWords} keywords per cluster ...\n`);
  const keywordsByCluster = computeClusterKeywords(byCluster, texts, topWords);

  // --- Print human-readable report ---
  process.stdout.write(`\n=== Cluster summary (k=${k}, ${ids.length} speeches) ===\n`);
  for (let cid = 0; cid < k; cid += 1) {
    const idxs = byCluster.get(cid) ?? [];
    const top = keywordsByCluster[`cluster-${cid}`] ?? [];
    const wordList = top
      .slice(0, topWords)
      .map((w) => `${w.word}(${w.count})`)
      .join(", ");
    process.stdout.write(
      `  cluster-${cid}  ${idxs.length.toString().padStart(3)} speeches  →  ${wordList}\n`,
    );
  }

  process.stdout.write(`\nWriting topic_id back to speeches ...\n`);
  const byTopic = new Map<string, string[]>();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const c = result.clusters[i];
    if (!id || c === undefined) continue;
    const topic = `cluster-${c}`;
    const list = byTopic.get(topic) ?? [];
    list.push(id);
    byTopic.set(topic, list);
  }
  const written = await writeTopicIds(byTopic);
  process.stdout.write(`  ${written} rows updated total\n`);

  // --- Write JSON file ---
  const out = {
    generatedAt: new Date().toISOString(),
    k,
    numSpeeches: ids.length,
    clusters: keywordsByCluster,
  };
  const jsonPath = join("src", "data", "topic-keywords.json");
  writeFileSync(jsonPath, `${JSON.stringify(out, null, 2)}\n`, "utf-8");
  process.stdout.write(`  wrote ${jsonPath}\n`);

  process.stdout.write(`\nDone.\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
