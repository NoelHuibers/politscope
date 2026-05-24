import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";

const r = await db.execute<{ id: string; umap_x: number; umap_y: number; party: string }>(sql`
  SELECT s.id::text AS id, s.umap_x, s.umap_y, m.party::text AS party
  FROM speeches s
  LEFT JOIN mps m ON s.mp_id = m.id
  WHERE s.umap_x IS NOT NULL AND s.umap_y IS NOT NULL AND m.party IS NOT NULL
  LIMIT 5
`);
process.stdout.write(`total: ${r.rows.length}\n`);
for (const row of r.rows) {
  process.stdout.write(`${row.id} | ${row.umap_x} | ${row.umap_y} | ${row.party}\n`);
}
