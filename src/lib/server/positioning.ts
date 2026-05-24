import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type PositioningMp = {
  extId: string;
  name: string;
  party: string;
  /** Projection onto (axisA - axisB) direction, normalised to [-1, +1]. +1 = axisA pole. */
  ax: number;
  /** Signed perpendicular component, normalised to [-1, +1]. */
  ay: number;
  n: number;
  isOutlier: boolean;
};

export type PositioningResponse = {
  mps: PositioningMp[];
  topic: string | null;
  axisA: string;
  axisB: string;
  axisACount: number;
  axisBCount: number;
};

type RawRow = {
  mp_id: string;
  ext_id: string;
  name: string;
  party: string;
  embedding: string;
};

const MIN_SPEECHES_FOR_AXIS = 1;

/**
 * Pure computation — separated from the server function so unit tests / debug
 * scripts can invoke it without spinning up the Start runtime.
 */
export function computePositioning(
  rows: RawRow[],
  axisA: string,
  axisB: string,
  topic: string | null,
): PositioningResponse {
  if (rows.length === 0) {
    return { mps: [], topic, axisA, axisB, axisACount: 0, axisBCount: 0 };
  }

  const parsed = rows.map((r) => ({
    mpId: r.mp_id,
    extId: r.ext_id,
    name: r.name,
    party: r.party,
    embedding: r.embedding
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(Number.parseFloat),
  }));

  const partySums = new Map<string, number[]>();
  const partyCounts = new Map<string, number>();
  for (const p of parsed) {
    const existing = partySums.get(p.party);
    if (existing) {
      for (let i = 0; i < existing.length; i += 1)
        existing[i] = (existing[i] ?? 0) + (p.embedding[i] ?? 0);
      partyCounts.set(p.party, (partyCounts.get(p.party) ?? 0) + 1);
    } else {
      partySums.set(p.party, [...p.embedding]);
      partyCounts.set(p.party, 1);
    }
  }

  const partyCentroid = (party: string): number[] | null => {
    const sum = partySums.get(party);
    const n = partyCounts.get(party);
    if (!(sum && n)) return null;
    return sum.map((v) => v / n);
  };

  const axisACount = partyCounts.get(axisA) ?? 0;
  const axisBCount = partyCounts.get(axisB) ?? 0;
  const aCentroid = partyCentroid(axisA);
  const bCentroid = partyCentroid(axisB);

  if (
    axisACount < MIN_SPEECHES_FOR_AXIS ||
    axisBCount < MIN_SPEECHES_FOR_AXIS ||
    !aCentroid ||
    !bCentroid
  ) {
    return { mps: [], topic, axisA, axisB, axisACount, axisBCount };
  }

  const dir = aCentroid.map((v, i) => v - (bCentroid[i] ?? 0));
  const dirNorm = Math.sqrt(dir.reduce((acc, v) => acc + v * v, 0)) || 1;
  const dirN = dir.map((v) => v / dirNorm);
  const midpoint = aCentroid.map((v, i) => (v + (bCentroid[i] ?? 0)) / 2);

  // Per-MP centroid (mean embedding across their speeches in this topic).
  type MpAcc = { extId: string; name: string; party: string; vec: number[]; count: number };
  const byMp = new Map<string, MpAcc>();
  for (const p of parsed) {
    const e = byMp.get(p.mpId);
    if (e) {
      for (let i = 0; i < e.vec.length; i += 1) e.vec[i] = (e.vec[i] ?? 0) + (p.embedding[i] ?? 0);
      e.count += 1;
    } else {
      byMp.set(p.mpId, {
        extId: p.extId,
        name: p.name,
        party: p.party,
        vec: [...p.embedding],
        count: 1,
      });
    }
  }

  // Pick a stable perpendicular sign basis — project onto axisA direction (perp component of A).
  // This makes ay sign deterministic across runs.
  const ySignBasis = aCentroid.map((v, i) => v - (midpoint[i] ?? 0));
  const ySignAxisComponent = ySignBasis.reduce((acc, v, i) => acc + v * (dirN[i] ?? 0), 0);
  const ySignPerp = ySignBasis.map((v, i) => v - ySignAxisComponent * (dirN[i] ?? 0));
  const ySignNorm = Math.sqrt(ySignPerp.reduce((acc, v) => acc + v * v, 0)) || 1;
  const ySignN = ySignPerp.map((v) => v / ySignNorm);

  const rawProjections: { acc: MpAcc; rawAx: number; rawAy: number }[] = [];
  for (const mp of byMp.values()) {
    const centroid = mp.vec.map((v) => v / mp.count);
    const rel = centroid.map((v, i) => v - (midpoint[i] ?? 0));
    const rawAx = rel.reduce((acc, v, i) => acc + v * (dirN[i] ?? 0), 0);
    const perpVec = rel.map((v, i) => v - rawAx * (dirN[i] ?? 0));
    const rawAy = perpVec.reduce((acc, v, i) => acc + v * (ySignN[i] ?? 0), 0);
    rawProjections.push({ acc: mp, rawAx, rawAy });
  }

  const maxAx = Math.max(...rawProjections.map((p) => Math.abs(p.rawAx))) || 1;
  const maxAy = Math.max(...rawProjections.map((p) => Math.abs(p.rawAy))) || 1;

  const mps: PositioningMp[] = rawProjections.map((p) => {
    const ax = (p.rawAx / maxAx) * 0.85;
    const ay = (p.rawAy / maxAy) * 0.85;
    return {
      extId: p.acc.extId,
      name: p.acc.name,
      party: p.acc.party,
      ax,
      ay,
      n: p.acc.count,
      isOutlier: Math.abs(ax) > 0.72,
    };
  });

  return { mps, topic, axisA, axisB, axisACount, axisBCount };
}

/** Fetch + compute MP positioning for a topic. */
export const getPositioning = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { topic: string | null; axisA: string; axisB: string } => {
    if (typeof input !== "object" || input === null) {
      return { topic: null, axisA: "afd", axisB: "grn" };
    }
    const obj = input as { topic?: unknown; axisA?: unknown; axisB?: unknown };
    const topic = typeof obj.topic === "string" && obj.topic.length > 0 ? obj.topic : null;
    const axisA = typeof obj.axisA === "string" && obj.axisA.length > 0 ? obj.axisA : "afd";
    const axisB = typeof obj.axisB === "string" && obj.axisB.length > 0 ? obj.axisB : "grn";
    return { topic, axisA, axisB };
  })
  .handler(async ({ data }): Promise<PositioningResponse> => {
    const topicFilter = data.topic === null ? sql`` : sql`AND s.topic_id = ${data.topic}`;
    const rows = await db.execute<RawRow>(sql`
      SELECT m.id::text AS mp_id, m.ext_id, m.name, m.party::text AS party,
             e.embedding::text AS embedding
      FROM speeches s
      JOIN speech_embeddings e ON e.speech_id = s.id
      JOIN mps m ON s.mp_id = m.id
      WHERE 1 = 1 ${topicFilter}
    `);
    return computePositioning(rows.rows, data.axisA, data.axisB, data.topic);
  });
