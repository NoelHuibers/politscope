#!/usr/bin/env -S npx tsx
/**
 * Tracer-bullet embed (#45): embed all speeches that don't yet have an
 * embedding using OpenAI text-embedding-3-small (1536-dim, locked in #6).
 *
 * Usage:
 *   pnpm tsx scripts/tracer-embed.ts
 *
 * Idempotent: skips speeches that already have an embedding row. Re-runnable
 * after partial failures.
 */
import "dotenv/config";

import process from "node:process";
import { inArray, sql } from "drizzle-orm";
import OpenAI from "openai";
import { db } from "../src/lib/db/index.js";
import { speechEmbeddings } from "../src/lib/db/schema.js";

const MODEL = "text-embedding-3-small";
const MODEL_ID = `openai/${MODEL}`;
const BATCH_SIZE = 100; // OpenAI supports up to 2048 inputs per request; 100 is conservative for retries.
const MAX_INPUT_CHARS = 32_000; // 8k tokens × ~4 chars/token — truncate longer speeches.

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing — set it in .env");
  }
  const openai = new OpenAI();

  // Find speeches that need embedding.
  const todo = await db.execute<{ id: string; text: string }>(sql`
    SELECT s.id::text AS id, s.text
    FROM speeches s
    WHERE NOT EXISTS (
      SELECT 1 FROM speech_embeddings e WHERE e.speech_id = s.id
    )
    ORDER BY s.id
  `);

  if (todo.rows.length === 0) {
    process.stdout.write("Nothing to embed — all speeches already have embeddings.\n");
    return;
  }

  process.stdout.write(`Embedding ${todo.rows.length} speeches with ${MODEL_ID} ...\n`);
  const startedAt = Date.now();
  let processed = 0;

  for (let i = 0; i < todo.rows.length; i += BATCH_SIZE) {
    const batch = todo.rows.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((r) => r.text.slice(0, MAX_INPUT_CHARS));

    const res = await embedWithRetry(openai, inputs);

    const rows = batch.map((r, idx) => {
      const vec = res.data[idx]?.embedding;
      if (!vec) throw new Error(`No embedding returned for batch item ${idx}`);
      return { speechId: r.id, embedding: vec, model: MODEL_ID };
    });

    // Insert into speech_embeddings — conflict shouldn't happen since we filtered.
    await db
      .insert(speechEmbeddings)
      .values(rows)
      .onConflictDoUpdate({
        target: speechEmbeddings.speechId,
        set: { embedding: sql`excluded.embedding`, model: sql`excluded.model` },
      });

    processed += batch.length;
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    process.stdout.write(`  ${processed}/${todo.rows.length} (${elapsed}s elapsed)\n`);
  }

  // Sanity check: count embeddings written.
  const ids = todo.rows.map((r) => r.id);
  const verifyResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(speechEmbeddings)
    .where(inArray(speechEmbeddings.speechId, ids));

  const verified = verifyResult[0]?.count ?? 0;
  const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(
    `\nDone. ${verified} embeddings written for ${todo.rows.length} requested speeches in ${totalSec}s.\n`,
  );
}

async function embedWithRetry(
  openai: OpenAI,
  inputs: string[],
  attempt = 1,
): Promise<{ data: Array<{ embedding: number[] }> }> {
  try {
    const res = await openai.embeddings.create({ model: MODEL, input: inputs });
    return res;
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (attempt < 5 && (status === 429 || status === 500 || status === 503)) {
      const backoff = 2 ** attempt * 1000;
      process.stdout.write(`  Retry ${attempt}/4 after ${backoff}ms (status ${status})\n`);
      await new Promise((r) => setTimeout(r, backoff));
      return embedWithRetry(openai, inputs, attempt + 1);
    }
    throw err;
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
