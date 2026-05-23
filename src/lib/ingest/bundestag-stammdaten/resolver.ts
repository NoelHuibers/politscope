import type { MpRawRecord } from "@/lib/ingest/bundestag-xml/types";
import type { StammdatenLookup, StammdatenMp } from "./types.js";

/**
 * Drizzle-insert-compatible MP record. Mirrors the columns of `mps`
 * table, minus the generated UUID + createdAt.
 */
export type MpInsert = {
  extId: string;
  name: string;
  party: StammdatenMp["party"];
  role: string | null;
  since: number | null;
};

/** Per-MP outcome of resolveMps — useful for reporting which MPs lacked Stammdaten matches. */
export type ResolveResult = {
  resolved: MpInsert[];
  /** Raw MPs whose extId was not found in Stammdaten. */
  unmatched: MpRawRecord[];
};

/**
 * Resolve raw protocol MPs against the Stammdaten lookup.
 *
 * - extId is used as the join key (Bundestag's stable internal ID)
 * - canonical name comes from Stammdaten (handles name changes mid-career)
 * - party comes from Stammdaten PARTEI_KURZ — distinguishes CDU vs CSU directly (#8)
 * - role is preserved from the raw protocol record (Stammdaten doesn't have minister positions)
 * - since-year comes from Stammdaten (earliest Wahlperiode the MP served in)
 *
 * If a raw MP's extId is not in Stammdaten, the record is added to `unmatched`
 * instead of being silently dropped or assigned bogus values. Callers can
 * decide to log them, skip the corresponding speeches, or fetch a newer
 * Stammdaten file.
 */
export function resolveMps(
  rawMps: Iterable<MpRawRecord>,
  stammdaten: StammdatenLookup,
): ResolveResult {
  const resolved: MpInsert[] = [];
  const unmatched: MpRawRecord[] = [];

  for (const raw of rawMps) {
    const sd = stammdaten.get(raw.extId);
    if (!sd) {
      unmatched.push(raw);
      continue;
    }
    resolved.push({
      extId: sd.extId,
      name: sd.canonicalName,
      party: sd.party,
      role: raw.role,
      since: sd.sinceYear,
    });
  }

  return { resolved, unmatched };
}
