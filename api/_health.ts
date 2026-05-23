import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";
import { mps, speeches } from "../src/lib/db/schema.js";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export async function health(): Promise<Response> {
  const started = Date.now();
  try {
    const nowResult = await db.execute<{ now: string }>(sql`SELECT NOW() AS now`);
    const mpsResult = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM ${mps}`,
    );
    const speechesResult = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM ${speeches}`,
    );

    const nowRow = nowResult.rows[0];
    const mpsRow = mpsResult.rows[0];
    const speechesRow = speechesResult.rows[0];

    if (!(nowRow && mpsRow && speechesRow)) {
      throw new Error("Empty result from one of the health queries");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        now: nowRow.now,
        mps_count: Number(mpsRow.count),
        speeches_count: Number(speechesRow.count),
        latency_ms: Date.now() - started,
      }),
      { status: 200, headers: HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
        latency_ms: Date.now() - started,
      }),
      { status: 503, headers: HEADERS },
    );
  }
}
