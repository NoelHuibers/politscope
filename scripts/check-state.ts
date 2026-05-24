#!/usr/bin/env -S npx tsx
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";
import { computeFingerprints } from "../src/lib/server/fingerprint.js";

async function main(): Promise<void> {
  const t = await db.execute<{ topic_id: string | null; n: number }>(sql`
    SELECT topic_id, COUNT(*)::int AS n FROM speeches GROUP BY topic_id ORDER BY topic_id
  `);
  process.stdout.write("=== topic_id distribution ===\n");
  for (const r of t.rows) process.stdout.write(`  ${r.topic_id ?? "<null>"}  ${r.n}\n`);

  // Topic-flows aggregation, mirrored from getTopicFlows.
  const flows = await db.execute<{ wahlperiode: number; topic_id: string; n: number }>(sql`
    SELECT s.wahlperiode, sp.topic_id, COUNT(*)::int AS n
    FROM speeches sp
    JOIN sessions s ON sp.session_id = s.id
    WHERE sp.topic_id IS NOT NULL
    GROUP BY s.wahlperiode, sp.topic_id
    ORDER BY s.wahlperiode, sp.topic_id
  `);
  process.stdout.write("\n=== topic flows (raw) ===\n");
  for (const r of flows.rows)
    process.stdout.write(`  WP${r.wahlperiode}  ${r.topic_id}  ${r.n}\n`);

  // Fingerprint smoke test — top-3 MPs.
  const rows = await db.execute<{
    ext_id: string;
    name: string;
    party: string;
    date: string;
    text: string;
    topic_id: string | null;
  }>(sql`
    SELECT m.ext_id, m.name, m.party::text AS party,
           s.date::text AS date, sp.text, sp.topic_id
    FROM speeches sp
    JOIN sessions s ON sp.session_id = s.id
    JOIN mps m ON sp.mp_id = m.id
  `);
  const fp = computeFingerprints(rows.rows, 3);
  process.stdout.write(`\n=== fingerprints (top-3 MPs) ===\n  axis: ${fp.axis.join(", ")}\n`);
  for (const mp of fp.mps) {
    process.stdout.write(
      `  ${mp.name} (${mp.party}, ${mp.totalSpeeches} Reden, ${mp.quarters.length} Quartale)\n`,
    );
    for (const q of mp.quarters.slice(0, 3)) {
      const f = q.features;
      process.stdout.write(
        `    ${q.q}  n=${q.n}  len=${f.sentenceLen.toFixed(2)}  ttr=${f.ttr.toFixed(2)}  emo=${f.emotion.toFixed(2)}  form=${f.formality.toFixed(2)}  dev=${f.deviation.toFixed(2)}\n`,
      );
    }
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
