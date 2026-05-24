#!/usr/bin/env -S npx tsx
/**
 * Download ~25 Bundestag Plenarprotokoll XMLs spread across WP19-21 into
 * `.cache/seed-xmls/`. This is the "demo seed" corpus — enough volume + time
 * variance to make Sankey (#19), Fingerprint (#22), and topic-flows non-degenerate
 * without paying for the full bulk ingest.
 *
 * URLs were discovered from the public AJAX endpoint:
 *   /ajax/filterlist/de/services/opendata/{listId}-{listId}?limit=N&offset=N
 * where listId is per-Wahlperiode (1058442=WP21, 866354=WP20, 543410=WP19).
 *
 * Idempotent: skips files that already exist locally.
 *
 * Usage:
 *   pnpm tsx scripts/fetch-seed-corpus.ts
 */
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const OUT_DIR = ".cache/seed-xmls";

const URLS: string[] = [
  // WP19 — last quarter of period (Apr-Oct 2021)
  "https://www.bundestag.de/resource/blob/843810/19230.xml",
  "https://www.bundestag.de/resource/blob/847180/19233.xml",
  "https://www.bundestag.de/resource/blob/849650/19236.xml",
  "https://www.bundestag.de/resource/blob/858472/19239.xml",

  // WP20 early — Jan-Jul 2022
  "https://www.bundestag.de/resource/blob/912024/20055.xml",
  "https://www.bundestag.de/resource/blob/913444/20058.xml",
  "https://www.bundestag.de/resource/blob/916362/20061.xml",
  "https://www.bundestag.de/resource/blob/918014/20064.xml",

  // WP20 mid-early — Mar-May 2023
  "https://www.bundestag.de/resource/blob/950324/20105.xml",
  "https://www.bundestag.de/resource/blob/953176/20108.xml",
  "https://www.bundestag.de/resource/blob/954874/20111.xml",
  "https://www.bundestag.de/resource/blob/957006/20114.xml",

  // WP20 mid-late — Jun-Sep 2023
  "https://www.bundestag.de/resource/blob/993546/20156.xml",
  "https://www.bundestag.de/resource/blob/994682/20158.xml",
  "https://www.bundestag.de/resource/blob/995236/20160.xml",
  "https://www.bundestag.de/resource/blob/997708/20163.xml",

  // WP20 late — Nov 2024-Mar 2025
  "https://www.bundestag.de/resource/blob/1033526/20205.xml",
  "https://www.bundestag.de/resource/blob/1035090/20207.xml",
  "https://www.bundestag.de/resource/blob/1042764/20211.xml",
  "https://www.bundestag.de/resource/blob/1057238/20213.xml",

  // WP21 — recent (2026)
  "https://www.bundestag.de/resource/blob/1167198/21073.xml",
  "https://www.bundestag.de/resource/blob/1174564/21076.xml",
  "https://www.bundestag.de/resource/blob/1179302/21079.xml",
  "https://www.bundestag.de/resource/blob/1181984/21080.xml",
];

function filenameFromUrl(url: string): string {
  const last = url.split("/").pop();
  if (!last) throw new Error(`bad url: ${url}`);
  return last;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

type DownloadResult =
  | { url: string; status: "saved"; size: number }
  | { url: string; status: "cached"; size: number }
  | { url: string; status: "failed"; error: string };

async function downloadOne(url: string): Promise<DownloadResult> {
  const filename = filenameFromUrl(url);
  const path = join(OUT_DIR, filename);

  if (await exists(path)) {
    const s = await stat(path);
    return { url, status: "cached", size: s.size };
  }

  const res = await fetch(url);
  if (!(res.ok && res.body)) {
    return { url, status: "failed", error: `HTTP ${res.status}` };
  }
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(path));
  const s = await stat(path);
  return { url, status: "saved", size: s.size };
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  process.stdout.write(`Seeding ${URLS.length} session XMLs to ${OUT_DIR}/ ...\n\n`);

  let savedCount = 0;
  let cachedCount = 0;
  let failedCount = 0;
  let totalBytes = 0;

  for (const url of URLS) {
    const result = await downloadOne(url);
    const filename = filenameFromUrl(url);
    if (result.status === "saved") {
      savedCount += 1;
      totalBytes += result.size;
      process.stdout.write(`  ↓ ${filename} (${Math.round(result.size / 1024)} KB)\n`);
    } else if (result.status === "cached") {
      cachedCount += 1;
      totalBytes += result.size;
      process.stdout.write(`  · ${filename} cached (${Math.round(result.size / 1024)} KB)\n`);
    } else {
      failedCount += 1;
      process.stdout.write(`  ✗ ${filename} FAILED (${result.error})\n`);
    }
  }

  process.stdout.write(
    `\nDone. ${savedCount} downloaded, ${cachedCount} cached, ${failedCount} failed. Total ${Math.round(totalBytes / 1024 / 1024)} MB.\n`,
  );
  if (failedCount > 0) process.exit(2);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
