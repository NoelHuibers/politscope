#!/usr/bin/env -S npx tsx
/**
 * Fetch MP photo URLs + attribution from Wikidata + Commons.
 *
 *   1. SPARQL: every Q-item that held a "Mitglied des Bundestages" (Q1939555)
 *      position AND has a P18 (image). Wikidata does not carry our Stammdaten
 *      ID, so we match by normalised name on the DB side.
 *   2. Commons imageinfo API in batches of 50: extract author + license per file.
 *   3. Write photo_url / photo_attribution / photo_attribution_url / photo_license
 *      back to the matching mps row.
 *
 * Idempotent: re-running overwrites existing photo metadata.
 *
 * Usage:
 *   pnpm tsx scripts/fetch-mp-photos.ts
 */
import "dotenv/config";
import process from "node:process";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "PolitScope/0.1 (https://github.com/NoelHuibers/politscope)";

type SparqlRow = {
  mp: { value: string };
  mpLabel?: { value: string };
  image: { value: string };
};

type ImageInfo = {
  author: string | null;
  license: string | null;
  pageUrl: string;
};

const TITLE_PREFIXES = [
  /^prof\.?\s+dr\.?\s+/i,
  /^dr\.?\s+h\.?\s*c\.?\s+/i,
  /^prof\.?\s+/i,
  /^dr\.?\s+/i,
];

/** Strip academic titles + lowercase + remove diacritics. */
function normalizeName(name: string): string {
  let n = name.trim();
  // Strip multiple title prefixes (e.g. "Dr. Dr. Zanda Grundberg").
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of TITLE_PREFIXES) {
      if (re.test(n)) {
        n = n.replace(re, "");
        changed = true;
      }
    }
  }
  return n
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritics
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function filenameFromImageUrl(url: string): string | null {
  const m = /Special:FilePath\/(.+)$/.exec(url);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1] ?? "");
  } catch {
    return m[1] ?? null;
  }
}

async function fetchSparql(): Promise<{ name: string; filename: string }[]> {
  // All Q-items that held a Bundestag-member position AND have an image.
  const query = `
    SELECT DISTINCT ?mp ?mpLabel ?image WHERE {
      ?mp p:P39 ?statement .
      ?statement ps:P39 ?position .
      ?position wdt:P279* wd:Q1939555 .
      ?mp wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de" . }
    }
  `;
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { results: { bindings: SparqlRow[] } };
  const out: { name: string; filename: string }[] = [];
  for (const row of body.results.bindings) {
    const filename = filenameFromImageUrl(row.image.value);
    const name = row.mpLabel?.value;
    if (filename && name) out.push({ name, filename });
  }
  return out;
}

type ImageinfoExtMetadata = Record<string, { value?: string } | undefined>;

async function fetchImageInfoBatch(filenames: string[]): Promise<Map<string, ImageInfo>> {
  if (filenames.length === 0) return new Map();
  const titles = filenames.map((f) => `File:${f}`).join("|");
  const params = new URLSearchParams({
    action: "query",
    prop: "imageinfo",
    iiprop: "extmetadata|url",
    iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl|Credit",
    iiextmetadatalanguage: "de",
    format: "json",
    titles,
  });
  const res = await fetch(`${COMMONS_API}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Commons ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: { extmetadata?: ImageinfoExtMetadata; descriptionurl?: string }[];
        }
      >;
    };
  };
  const out = new Map<string, ImageInfo>();
  for (const page of Object.values(body.query?.pages ?? {})) {
    const title = page.title?.replace(/^File:/, "");
    if (!title) continue;
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    const author = meta.Artist?.value ? stripHtml(meta.Artist.value) : null;
    const license = meta.LicenseShortName?.value ? stripHtml(meta.LicenseShortName.value) : null;
    const pageUrl = info?.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${title}`;
    out.set(title, { author, license, pageUrl });
  }
  return out;
}

async function main(): Promise<void> {
  process.stdout.write("Loading MPs from DB ...\n");
  const dbRows = await db.execute<{ ext_id: string; name: string }>(
    sql`SELECT ext_id, name FROM mps`,
  );
  // Map normalized name → ext_id (allow multiple — pick first).
  const dbByName = new Map<string, string>();
  for (const r of dbRows.rows) {
    const key = normalizeName(r.name);
    if (!dbByName.has(key)) dbByName.set(key, r.ext_id);
  }
  process.stdout.write(
    `  ${dbRows.rows.length} MPs in DB (${dbByName.size} unique normalised names)\n`,
  );

  process.stdout.write("Querying Wikidata SPARQL ...\n");
  const wd = await fetchSparql();
  process.stdout.write(`  ${wd.length} Bundestag MPs with P18 (image) in Wikidata\n`);

  // Match Wikidata results against our DB by normalised name.
  const matches: { extId: string; filename: string }[] = [];
  for (const row of wd) {
    const key = normalizeName(row.name);
    const extId = dbByName.get(key);
    if (extId) matches.push({ extId, filename: row.filename });
  }
  // Dedupe — if Wikidata has multiple images for one MP (some do), keep the first.
  const seen = new Set<string>();
  const work = matches.filter((m) => {
    if (seen.has(m.extId)) return false;
    seen.add(m.extId);
    return true;
  });
  process.stdout.write(
    `  ${work.length} matched our corpus (${dbByName.size - work.length} unmatched)\n`,
  );

  if (work.length === 0) {
    process.stdout.write("Nothing to fetch — exiting.\n");
    return;
  }

  process.stdout.write("Fetching Commons imageinfo in batches of 50 ...\n");
  const BATCH = 50;
  const infoByFile = new Map<string, ImageInfo>();
  for (let i = 0; i < work.length; i += BATCH) {
    const slice = work.slice(i, i + BATCH);
    const batch = await fetchImageInfoBatch(slice.map((s) => s.filename));
    for (const [k, v] of batch) infoByFile.set(k, v);
    process.stdout.write(`  ${Math.min(i + BATCH, work.length)}/${work.length}\n`);
  }

  process.stdout.write("Writing photo metadata to mps ...\n");
  let written = 0;
  let licensed = 0;
  for (const { extId, filename } of work) {
    const info = infoByFile.get(filename);
    const photoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    const pageUrl = info?.pageUrl ?? null;
    const author = info?.author ?? null;
    const license = info?.license ?? null;
    if (license) licensed += 1;
    await db.execute(sql`
      UPDATE mps SET
        photo_url = ${photoUrl},
        photo_attribution_url = ${pageUrl},
        photo_attribution = ${author},
        photo_license = ${license}
      WHERE ext_id = ${extId}
    `);
    written += 1;
  }
  process.stdout.write(`\nDone. ${written} rows updated, ${licensed} with license info.\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
