#!/usr/bin/env -S npx tsx
/**
 * Tracer-bullet ingest (#45): parse XML fixtures + Stammdaten, write to Neon.
 *
 * Idempotent: per-session, deletes any existing speeches for that
 * (wahlperiode, sitzung) before inserting fresh ones. MPs and sessions use
 * upsert-on-unique-key so re-running doesn't duplicate.
 *
 * Usage:
 *   pnpm tsx scripts/tracer-ingest.ts <xml-dir> <stammdaten.xml>
 *
 * Example:
 *   pnpm tsx scripts/tracer-ingest.ts \
 *     src/lib/ingest/bundestag-xml/__fixtures__/real-sample-wp21 \
 *     src/lib/ingest/bundestag-stammdaten/__fixtures__/real/MDB_STAMMDATEN.XML
 */
import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import process from "node:process";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";
import { mps, sessions, speeches } from "../src/lib/db/schema.js";
import { parseStammdaten, resolveMps } from "../src/lib/ingest/bundestag-stammdaten/index.js";
import { parseFile } from "../src/lib/ingest/bundestag-xml/index.js";
import type { MpRawRecord } from "../src/lib/ingest/bundestag-xml/types.js";

type Args = { xmlDir: string; stammdatenPath: string };

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  if (args.length < 2) {
    throw new Error("usage: tracer-ingest.ts <xml-dir> <stammdaten.xml>");
  }
  return { xmlDir: args[0] ?? "", stammdatenPath: args[1] ?? "" };
}

async function readXmlFiles(dir: string): Promise<{ source: string; content: string }[]> {
  const entries = await readdir(dir);
  const out: { source: string; content: string }[] = [];
  for (const entry of entries.sort()) {
    if (extname(entry).toLowerCase() !== ".xml") continue;
    const content = await readFile(join(dir, entry), "utf-8");
    out.push({ source: entry, content });
  }
  return out;
}

async function main(): Promise<void> {
  const { xmlDir, stammdatenPath } = parseArgs(process.argv);

  process.stdout.write(`Reading Stammdaten from ${stammdatenPath} ...\n`);
  const stammdatenXml = await readFile(stammdatenPath, "utf-8");
  const stammdaten = parseStammdaten(stammdatenXml, stammdatenPath);
  process.stdout.write(`  ${stammdaten.size} MPs loaded\n`);

  process.stdout.write(`Reading protocol XMLs from ${xmlDir} ...\n`);
  const files = await readXmlFiles(xmlDir);
  process.stdout.write(`  ${files.length} files\n`);

  // Aggregate raw MPs across all files (deduped by extId via Map).
  const rawMpsByExtId = new Map<string, MpRawRecord>();
  const parsed = files.map((f) => {
    const r = parseFile(f.content, f.source);
    for (const mp of r.mps) if (!rawMpsByExtId.has(mp.extId)) rawMpsByExtId.set(mp.extId, mp);
    return r;
  });

  process.stdout.write(
    `  ${parsed.length} sessions, ${parsed.reduce((a, b) => a + b.speeches.length, 0)} speeches, ${rawMpsByExtId.size} unique MPs\n`,
  );

  // Resolve MPs against Stammdaten.
  const { resolved, unmatched } = resolveMps(rawMpsByExtId.values(), stammdaten);
  process.stdout.write(`  Resolved ${resolved.length} MPs, ${unmatched.length} unmatched\n`);
  if (unmatched.length > 0) {
    process.stdout.write(`  Unmatched extIds: ${unmatched.map((m) => m.extId).join(", ")}\n`);
  }

  // --- DB writes ---

  // 1. Upsert MPs by extId.
  process.stdout.write(`Upserting MPs ...\n`);
  if (resolved.length > 0) {
    await db
      .insert(mps)
      .values(resolved)
      .onConflictDoUpdate({
        target: mps.extId,
        set: {
          name: sql`excluded.name`,
          party: sql`excluded.party`,
          role: sql`excluded.role`,
          since: sql`excluded.since`,
        },
      });
  }

  // Fetch the MP UUIDs we just wrote (for FK references).
  const extIds = resolved.map((m) => m.extId);
  const mpRows =
    extIds.length > 0
      ? await db
          .select({ id: mps.id, extId: mps.extId })
          .from(mps)
          .where(inArray(mps.extId, extIds))
      : [];
  const mpIdByExtId = new Map(mpRows.map((r) => [r.extId, r.id]));
  process.stdout.write(`  ${mpRows.length} MP rows in DB\n`);

  // 2. Per session: upsert session, delete old speeches, insert fresh speeches.
  let totalSpeechesInserted = 0;
  for (const p of parsed) {
    const { wahlperiode, sitzung, date } = p.session;

    // Upsert session by (wahlperiode, sitzung).
    const [sessionRow] = await db
      .insert(sessions)
      .values({ wahlperiode, sitzung, date })
      .onConflictDoUpdate({
        target: [sessions.wahlperiode, sessions.sitzung],
        set: { date },
      })
      .returning({ id: sessions.id });

    if (!sessionRow)
      throw new Error(`session upsert failed for WP${wahlperiode} sitzung ${sitzung}`);

    // Delete existing speeches for this session — idempotency.
    await db.delete(speeches).where(eq(speeches.sessionId, sessionRow.id));

    // Insert fresh speech rows.
    const speechRows = p.speeches.map((s) => ({
      sessionId: sessionRow.id,
      mpId: s.mpExtId ? (mpIdByExtId.get(s.mpExtId) ?? null) : null,
      top: s.top,
      wordCount: s.wordCount,
      text: s.text,
      topicId: null,
      umapX: null,
      umapY: null,
    }));

    if (speechRows.length > 0) {
      await db.insert(speeches).values(speechRows);
    }

    process.stdout.write(
      `  WP${wahlperiode} sitzung ${sitzung} (${date}): ${speechRows.length} speeches\n`,
    );
    totalSpeechesInserted += speechRows.length;
  }

  process.stdout.write(`\nDone. ${totalSpeechesInserted} total speeches written.\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
