#!/usr/bin/env -S npx tsx
/**
 * Parse a directory of Bundestag Plenarprotokoll XML files and emit JSONL.
 *
 * Usage:
 *   pnpm tsx scripts/ingest-bundestag.ts <directory>
 *   pnpm tsx scripts/ingest-bundestag.ts <directory> --kind speeches
 *   pnpm tsx scripts/ingest-bundestag.ts <directory> --kind mps
 *   pnpm tsx scripts/ingest-bundestag.ts <directory> --kind sessions
 *   pnpm tsx scripts/ingest-bundestag.ts <directory> --kind all  (default)
 *
 * Output: one JSON record per line on stdout, prefixed with kind:
 *   {"kind":"session","record":{...}}
 *   {"kind":"mp","record":{...}}
 *   {"kind":"speech","record":{...}}
 *
 * Errors logged to stderr; exits non-zero on any unrecoverable error.
 */

import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import process from "node:process";
import {
  streamMps,
  streamSessions,
  streamSpeeches,
} from "../src/lib/ingest/bundestag-xml/index.js";

type Kind = "speeches" | "mps" | "sessions" | "all";

function parseArgs(argv: string[]): { dir: string; kind: Kind } {
  const args = argv.slice(2);
  let dir: string | null = null;
  let kind: Kind = "all";
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--kind" && i + 1 < args.length) {
      const next = args[i + 1] as Kind;
      if (next !== "speeches" && next !== "mps" && next !== "sessions" && next !== "all") {
        throw new Error(`--kind must be speeches|mps|sessions|all (got ${next})`);
      }
      kind = next;
      i += 1;
    } else if (!a?.startsWith("--")) {
      dir = a ?? null;
    }
  }
  if (!dir) {
    throw new Error("usage: ingest-bundestag.ts <directory> [--kind speeches|mps|sessions|all]");
  }
  return { dir, kind };
}

async function* readXmlFiles(dir: string): AsyncIterable<{ source: string; content: string }> {
  const entries = await readdir(dir);
  for (const entry of entries.sort()) {
    if (extname(entry).toLowerCase() !== ".xml") continue;
    const fullPath = join(dir, entry);
    const content = await readFile(fullPath, "utf-8");
    yield { source: entry, content };
  }
}

function writeLine(line: string): void {
  process.stdout.write(`${line}\n`);
}

async function main(): Promise<void> {
  const { dir, kind } = parseArgs(process.argv);

  if (kind === "sessions" || kind === "all") {
    for await (const session of streamSessions(readXmlFiles(dir))) {
      writeLine(JSON.stringify({ kind: "session", record: session }));
    }
  }
  if (kind === "mps" || kind === "all") {
    for await (const mp of streamMps(readXmlFiles(dir))) {
      writeLine(JSON.stringify({ kind: "mp", record: mp }));
    }
  }
  if (kind === "speeches" || kind === "all") {
    for await (const speech of streamSpeeches(readXmlFiles(dir))) {
      writeLine(JSON.stringify({ kind: "speech", record: speech }));
    }
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
