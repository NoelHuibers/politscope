import type { partyEnum } from "@/lib/db/schema";

/** One of the values from the partyEnum in our Drizzle schema. */
export type PartyId = (typeof partyEnum.enumValues)[number];

/**
 * One MP record extracted from Bundestag Stammdaten XML.
 * Contains everything needed to populate the canonical `mps` row
 * after joining with the raw protocol MP from #12.
 */
export type StammdatenMp = {
  /** 8-digit Bundestag MdB ID — same value as protocol XML's <redner @id>. */
  extId: string;
  /** Canonical display name assembled from the latest <NAME> entry: titel + vorname + nachname (with disambiguator). */
  canonicalName: string;
  /** Resolved enum from PARTEI_KURZ — already distinguishes "cdu" vs "csu". */
  party: PartyId;
  /** Year first elected — minimum of all WAHLPERIODE.MDBWP_VON years. null if no WP entries. */
  sinceYear: number | null;
  /**
   * Original PARTEI_KURZ text for debugging / auditing. Useful when the mapper
   * encounters an unknown party value and falls back to "none".
   */
  rawParteiKurz: string;
  /** Wahlperioden the MP served in, sorted ascending. Useful for filtering active MPs. */
  wahlperioden: number[];
  /** Date of death if known — YYYY-MM-DD. null if alive or unknown. */
  sterbedatum: string | null;
};

/** A lookup by extId — the primary access pattern when resolving raw protocol MPs. */
export type StammdatenLookup = Map<string, StammdatenMp>;
