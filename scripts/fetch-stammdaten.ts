#!/usr/bin/env -S npx tsx
/**
 * Download the latest Bundestag MdB-Stammdaten ZIP and extract MDB_STAMMDATEN.XML
 * into the fixture directory. Used by anyone who needs the full file locally
 * (it's gitignored due to its 15 MB size).
 */
import { createWriteStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const URL = "https://www.bundestag.de/resource/blob/472878/MdB-Stammdaten.zip";
const OUT_DIR = "src/lib/ingest/bundestag-stammdaten/__fixtures__/real";

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const zipPath = join(OUT_DIR, "stammdaten.zip");

  process.stdout.write(`Downloading ${URL} ...\n`);
  const res = await fetch(URL);
  if (!(res.ok && res.body)) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(zipPath));
  process.stdout.write(`Saved ${zipPath}\n`);

  process.stdout.write(`Extracting via system unzip ...\n`);
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync("unzip", ["-o", zipPath, "-d", OUT_DIR], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`unzip exited with status ${result.status}`);
  }

  // Clean up the zip and macOS metadata directory.
  await rm(zipPath, { force: true });
  await rm(join(OUT_DIR, "__MACOSX"), { recursive: true, force: true });

  // Write a README explaining the file presence.
  await writeFile(
    join(OUT_DIR, "README.md"),
    [
      "# Stammdaten fixture (real)",
      "",
      "`MDB_STAMMDATEN.XML` and `MDB_STAMMDATEN.DTD` are downloaded via `pnpm fetch-stammdaten`",
      "and **gitignored** because the XML is ~15 MB. Re-run the fetch script to refresh.",
      "",
      `Source: ${URL}`,
    ].join("\n"),
    "utf-8",
  );

  process.stdout.write("Done.\n");
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
