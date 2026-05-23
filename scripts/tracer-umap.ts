#!/usr/bin/env -S npx tsx
/**
 * Tracer-bullet UMAP (#45): project all 1536D speech embeddings to 2D and
 * write umap_x / umap_y back to the speeches table.
 *
 * Stores coords as int16 in the range [-32_000, 32_000] — schema is `integer`
 * so we use this range to leave headroom for clean client-side normalisation
 * back to [-1, 1]. The atlas server function does that division.
 *
 * Usage:
 *   pnpm tsx scripts/tracer-umap.ts
 */
import "dotenv/config";

import process from "node:process";
import { sql } from "drizzle-orm";
import { UMAP } from "umap-js";
import { db } from "../src/lib/db/index.js";

const SCALE = 32_000;
const N_NEIGHBORS = 15;
const MIN_DIST = 0.1;

async function main(): Promise<void> {
  process.stdout.write(`Reading embeddings ...\n`);
  // The Drizzle ORM returns vector as comma-separated string. Cast to text and parse.
  const rows = await db.execute<{ id: string; embedding: string }>(sql`
    SELECT s.id::text AS id, e.embedding::text AS embedding
    FROM speeches s
    JOIN speech_embeddings e ON e.speech_id = s.id
    ORDER BY s.id
  `);

  if (rows.rows.length < N_NEIGHBORS + 1) {
    throw new Error(
      `Not enough rows for UMAP (need ≥ ${N_NEIGHBORS + 1}, got ${rows.rows.length})`,
    );
  }
  process.stdout.write(`  ${rows.rows.length} embeddings loaded\n`);

  // Parse the comma-separated vector strings into number[].
  const ids: string[] = [];
  const vectors: number[][] = [];
  for (const row of rows.rows) {
    ids.push(row.id);
    const trimmed = row.embedding.replace(/^\[|\]$/g, "");
    vectors.push(trimmed.split(",").map(Number.parseFloat));
  }
  process.stdout.write(`  vectors parsed (${vectors[0]?.length}D)\n`);

  process.stdout.write(`Running UMAP (n_neighbors=${N_NEIGHBORS}, min_dist=${MIN_DIST}) ...\n`);
  const t0 = Date.now();
  // Mulberry32 — small seeded PRNG so the tracer is deterministic but UMAP
  // still gets varied random numbers (a constant function breaks the algorithm).
  let seed = 0xdeadbeef;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const umap = new UMAP({
    nNeighbors: Math.min(N_NEIGHBORS, vectors.length - 1),
    minDist: MIN_DIST,
    nComponents: 2,
    random,
  });
  const embedding2d = umap.fit(vectors);
  process.stdout.write(`  done in ${Math.round((Date.now() - t0) / 1000)}s\n`);

  // Normalize to [-1, 1], then scale to [-SCALE, SCALE].
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of embedding2d) {
    if (x === undefined || y === undefined) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  process.stdout.write(`Writing UMAP coords to DB ...\n`);
  let written = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const point = embedding2d[i];
    if (!(id && point)) continue;
    const [x, y] = point;
    if (x === undefined || y === undefined) continue;
    const nx = (((x - minX) / spanX) * 2 - 1) * SCALE;
    const ny = (((y - minY) / spanY) * 2 - 1) * SCALE;
    await db.execute(sql`
      UPDATE speeches
      SET umap_x = ${Math.round(nx)}, umap_y = ${Math.round(ny)}
      WHERE id = ${id}::uuid
    `);
    written += 1;
  }

  process.stdout.write(`\nDone. ${written} rows updated with UMAP coords.\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
