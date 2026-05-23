import type { PartyId } from "./types.js";

/**
 * Map a raw PARTEI_KURZ value from Stammdaten to our schema enum.
 *
 * Historical predecessor parties (PDS → linke) and minor party labels
 * are folded forward where the mapping is uncontroversial. Anything we
 * don't recognise falls through to "none" — that signals "look at this"
 * to whoever runs the next ingest pass rather than silently picking wrong.
 */
const RAW_TO_PARTY = new Map<string, PartyId>([
  ["CDU", "cdu"],
  ["CSU", "csu"],
  ["SPD", "spd"],
  ["GRÜNE", "grn"],
  ["GRÜNES", "grn"],
  ["B90/GRÜNE", "grn"],
  ["BÜNDNIS 90/DIE GRÜNEN", "grn"],
  ["DIE GRÜNEN/BÜNDNIS 90", "grn"],
  ["FDP", "fdp"],
  ["AfD", "afd"],
  ["DIE LINKE.", "lnk"],
  ["DIE LINKE", "lnk"],
  ["LINKE", "lnk"],
  ["PDS", "lnk"],
  ["BSW", "bsw"],
  ["fraktionslos", "none"],
  ["parteilos", "none"],
  ["Plos", "none"],
  ["", "none"],
]);

/**
 * Resolve a raw PARTEI_KURZ value (or empty/missing) to a PartyId.
 * Returns "none" for unknown values — callers can detect this via comparison
 * with the original raw value to log unmapped party strings.
 */
export function mapParty(raw: string | null | undefined): PartyId {
  if (!raw) return "none";
  return RAW_TO_PARTY.get(raw.trim()) ?? "none";
}

/** Set of recognised raw party strings — exposed for diagnostic tooling. */
export const KNOWN_PARTY_STRINGS: ReadonlySet<string> = new Set(RAW_TO_PARTY.keys());
