"use client";

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { PARTIES, type PartyId } from "@/data/parties";

const ALL_PARTY_IDS = PARTIES.map((p) => p.id);

/**
 * URL-synced filter state (shareable PolitScope views).
 *
 * `parties` — selected fraktion ids (default: all)
 * `period`  — Wahlperiode 12..21 (default: 21)
 * `topic`   — selected topic id (default: null)
 */
export function useFilters() {
  return useQueryStates(
    {
      parties: parseAsArrayOf(parseAsString).withDefault(ALL_PARTY_IDS),
      period: parseAsInteger.withDefault(21),
      topic: parseAsString,
    },
    { history: "replace", clearOnDefault: true },
  );
}

export type FilterParties = readonly PartyId[];
