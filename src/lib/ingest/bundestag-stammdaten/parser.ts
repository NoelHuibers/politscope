import { XMLParser } from "fast-xml-parser";
import { InvalidStammdatenRootError, StammdatenParseError } from "./errors.js";
import { mapParty } from "./party-map.js";
import type { StammdatenLookup, StammdatenMp } from "./types.js";

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  textNodeName: "#text",
  parseTagValue: false,
  trimValues: true,
  isArray: (tagName) =>
    tagName === "MDB" ||
    tagName === "NAME" ||
    tagName === "WAHLPERIODE" ||
    tagName === "INSTITUTION",
});

type XmlNode = Record<string, unknown>;

/**
 * Parse a full Bundestag Stammdaten XML document and return a lookup keyed by extId.
 *
 * @param content - XML content as a string (typically ~15 MB)
 * @param source - source identifier for error messages
 */
export function parseStammdaten(content: string, source = "<stammdaten>"): StammdatenLookup {
  let doc: unknown;
  try {
    doc = xmlParser.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new StammdatenParseError(`malformed XML: ${detail}`, source);
  }

  const root = pickRoot(doc, source);
  const mdbs = asArray(root.MDB);
  const lookup: StammdatenLookup = new Map();
  for (const mdb of mdbs) {
    if (!mdb || typeof mdb !== "object") continue;
    const record = extractMdb(mdb as XmlNode);
    if (record) lookup.set(record.extId, record);
  }
  return lookup;
}

/**
 * Convenience: stream MdB records one at a time. Useful for piping to JSONL
 * without holding the full Map in memory if a caller wants to.
 */
export function* iterateStammdaten(
  content: string,
  source = "<stammdaten>",
): Iterable<StammdatenMp> {
  let doc: unknown;
  try {
    doc = xmlParser.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new StammdatenParseError(`malformed XML: ${detail}`, source);
  }

  const root = pickRoot(doc, source);
  const mdbs = asArray(root.MDB);
  for (const mdb of mdbs) {
    if (!mdb || typeof mdb !== "object") continue;
    const record = extractMdb(mdb as XmlNode);
    if (record) yield record;
  }
}

// ---------- internal helpers ----------

function pickRoot(doc: unknown, source: string): XmlNode {
  if (!doc || typeof doc !== "object") {
    throw new StammdatenParseError("document is not an object", source);
  }
  const rootKey = Object.keys(doc as object).find((k) => k !== "?xml" && k !== "#text");
  if (!rootKey) throw new StammdatenParseError("no root element", source);
  if (rootKey !== "DOCUMENT") throw new InvalidStammdatenRootError(rootKey, source);
  const root = (doc as XmlNode)[rootKey];
  if (!root || typeof root !== "object") {
    throw new StammdatenParseError("root element has no body", source);
  }
  return root as XmlNode;
}

function extractMdb(mdb: XmlNode): StammdatenMp | null {
  const extId = readText(mdb.ID);
  if (!extId) return null;

  const namen = mdb.NAMEN as XmlNode | undefined;
  const canonicalName = pickCanonicalName(namen);

  const bio = mdb.BIOGRAFISCHE_ANGABEN as XmlNode | undefined;
  const rawParteiKurz = bio ? (readText(bio.PARTEI_KURZ) ?? "") : "";
  const sterbeRaw = bio ? readText(bio.STERBEDATUM) : null;
  const sterbedatum = sterbeRaw ? parseGermanDate(sterbeRaw) : null;

  const wahlperioden = mdb.WAHLPERIODEN as XmlNode | undefined;
  const wps = wahlperioden ? asArray(wahlperioden.WAHLPERIODE) : [];
  const wpNumbers: number[] = [];
  let earliestStart: Date | null = null;
  for (const wp of wps) {
    if (!wp || typeof wp !== "object") continue;
    const wpNode = wp as XmlNode;
    const wpNumRaw = readText(wpNode.WP);
    if (wpNumRaw) {
      const wpNum = Number.parseInt(wpNumRaw, 10);
      if (!Number.isNaN(wpNum)) wpNumbers.push(wpNum);
    }
    const startRaw = readText(wpNode.MDBWP_VON);
    if (startRaw) {
      const isoDate = parseGermanDate(startRaw);
      if (isoDate) {
        const d = new Date(isoDate);
        if (earliestStart === null || d < earliestStart) earliestStart = d;
      }
    }
  }

  wpNumbers.sort((a, b) => a - b);
  const sinceYear = earliestStart ? earliestStart.getUTCFullYear() : null;

  return {
    extId,
    canonicalName,
    party: mapParty(rawParteiKurz),
    sinceYear,
    rawParteiKurz,
    wahlperioden: wpNumbers,
    sterbedatum,
  };
}

/**
 * Pick the canonical name from the NAMEN block.
 * Rules:
 * - Prefer the entry with empty HISTORIE_BIS (current name)
 * - Among current-name candidates (should usually be exactly one), pick the latest HISTORIE_VON
 * - Fall back to the last NAME element if none have an empty HISTORIE_BIS
 */
function pickCanonicalName(namen: XmlNode | undefined): string {
  if (!namen || typeof namen !== "object") return "Unbekannt";
  const names = asArray(namen.NAME);
  if (names.length === 0) return "Unbekannt";

  const withDates = names
    .filter((n): n is XmlNode => !!n && typeof n === "object")
    .map((n) => ({
      node: n,
      bis: readText(n.HISTORIE_BIS),
      von: readText(n.HISTORIE_VON),
    }));

  const current = withDates.filter((n) => !n.bis);
  const pool = current.length > 0 ? current : withDates;
  pool.sort((a, b) => {
    const av = a.von ? (parseGermanDate(a.von) ?? "") : "";
    const bv = b.von ? (parseGermanDate(b.von) ?? "") : "";
    return bv.localeCompare(av);
  });

  const picked = pool[0];
  return picked ? assembleName(picked.node) : "Unbekannt";
}

function assembleName(name: XmlNode): string {
  const anrede = readText(name.ANREDE_TITEL);
  const akad = readText(name.AKAD_TITEL);
  const vorname = readText(name.VORNAME);
  const praefix = readText(name.PRAEFIX);
  const adel = readText(name.ADEL);
  const nachname = readText(name.NACHNAME);
  const ortszusatz = readText(name.ORTSZUSATZ);

  const titlePart = [anrede, akad].filter(Boolean).join(" ");
  const surnamePart = [praefix, adel, nachname].filter(Boolean).join(" ");
  const assembled = [titlePart, vorname, surnamePart].filter(Boolean).join(" ").trim();
  if (!assembled) return "Unbekannt";
  return ortszusatz ? `${assembled} ${ortszusatz}` : assembled;
}

function asArray(v: unknown): unknown[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function readText(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v !== null && "#text" in v) {
    const t = (v as { "#text"?: unknown })["#text"];
    return typeof t === "string" ? t.trim() || null : null;
  }
  return null;
}

function parseGermanDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  if (!(dd && mm && yyyy)) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
