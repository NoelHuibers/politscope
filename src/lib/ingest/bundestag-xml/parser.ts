import { XMLParser } from "fast-xml-parser";
import { InvalidRootElementError, MalformedXmlError, MissingMetadataError } from "./errors.js";
import type { MpRawRecord, SessionRecord, SpeechRecord } from "./types.js";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  // Force arrays for elements that can repeat — avoids "single element becomes object" surprises.
  isArray: (tagName) =>
    tagName === "tagesordnungspunkt" ||
    tagName === "rede" ||
    tagName === "p" ||
    tagName === "kommentar",
});

/**
 * Result of parsing one Plenarprotokoll XML file.
 * MPs are deduplicated within the file by extId.
 */
export type ParseFileResult = {
  session: SessionRecord;
  mps: MpRawRecord[];
  speeches: SpeechRecord[];
};

/**
 * Parse one Bundestag Plenarprotokoll XML file.
 *
 * @param content - XML file content as a string
 * @param source - file path or identifier for error messages
 */
export function parseFile(content: string, source = "<unknown>"): ParseFileResult {
  let doc: unknown;
  try {
    doc = xmlParser.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new MalformedXmlError(detail, source);
  }

  const root = pickRoot(doc, source);
  const session = extractSession(root, source);
  const speeches: SpeechRecord[] = [];
  const mpByExtId = new Map<string, MpRawRecord>();

  const sitzungsverlauf = root.sitzungsverlauf;
  if (!sitzungsverlauf || typeof sitzungsverlauf !== "object") {
    return { session, mps: [], speeches: [] };
  }

  const tops = asArray((sitzungsverlauf as XmlNode).tagesordnungspunkt);
  for (const top of tops) {
    if (!top || typeof top !== "object") continue;
    const topNode = top as XmlNode;
    const topNumber = parseTopNumber(readAttr(topNode, "@_top-id"));
    const redes = asArray(topNode.rede);
    for (const rede of redes) {
      if (!rede || typeof rede !== "object") continue;
      const speech = extractSpeech(rede as XmlNode, session, topNumber, mpByExtId);
      if (speech) speeches.push(speech);
    }
  }

  return {
    session,
    mps: [...mpByExtId.values()],
    speeches,
  };
}

/**
 * Stream sessions from a stream of XML files (one SessionRecord per file).
 */
export async function* streamSessions(
  files: AsyncIterable<{ source: string; content: string }>,
): AsyncIterable<SessionRecord> {
  for await (const file of files) {
    yield parseFile(file.content, file.source).session;
  }
}

/**
 * Stream MP raw records across multiple files, deduplicated by extId.
 */
export async function* streamMps(
  files: AsyncIterable<{ source: string; content: string }>,
): AsyncIterable<MpRawRecord> {
  const seen = new Set<string>();
  for await (const file of files) {
    const { mps } = parseFile(file.content, file.source);
    for (const mp of mps) {
      if (seen.has(mp.extId)) continue;
      seen.add(mp.extId);
      yield mp;
    }
  }
}

/**
 * Stream speech records across multiple files. Order preserved within each file.
 */
export async function* streamSpeeches(
  files: AsyncIterable<{ source: string; content: string }>,
): AsyncIterable<SpeechRecord> {
  for await (const file of files) {
    const { speeches } = parseFile(file.content, file.source);
    for (const speech of speeches) yield speech;
  }
}

// ---------- internal helpers ----------

type XmlNode = Record<string, unknown>;

function pickRoot(doc: unknown, source: string): XmlNode {
  if (!doc || typeof doc !== "object") {
    throw new MalformedXmlError("document is not an object", source);
  }
  const rootKey = Object.keys(doc as object).find((k) => k !== "?xml" && k !== "#text");
  if (!rootKey) throw new MalformedXmlError("no root element", source);
  if (rootKey !== "dbtplenarprotokoll") {
    throw new InvalidRootElementError(rootKey, source);
  }
  const root = (doc as XmlNode)[rootKey];
  if (!root || typeof root !== "object") {
    throw new MalformedXmlError("root element has no body", source);
  }
  return root as XmlNode;
}

function extractSession(root: XmlNode, source: string): SessionRecord {
  const wp = readAttr(root, "@_wahlperiode") ?? readAttr(root, "@_sitzung-wahlperiode");
  const sitzung = readAttr(root, "@_sitzung-nr");
  const rawDate = readAttr(root, "@_sitzung-datum");

  if (!wp) throw new MissingMetadataError("wahlperiode (root attribute)", source);
  if (!sitzung) throw new MissingMetadataError("sitzung-nr (root attribute)", source);
  if (!rawDate) throw new MissingMetadataError("sitzung-datum (root attribute)", source);

  const wpNum = Number.parseInt(wp, 10);
  const sitzungNum = Number.parseInt(sitzung, 10);
  if (Number.isNaN(wpNum)) throw new MissingMetadataError(`wahlperiode (got "${wp}")`, source);
  if (Number.isNaN(sitzungNum)) {
    throw new MissingMetadataError(`sitzung-nr (got "${sitzung}")`, source);
  }

  const isoDate = parseGermanDate(rawDate);
  if (!isoDate) throw new MissingMetadataError(`sitzung-datum (got "${rawDate}")`, source);

  return { wahlperiode: wpNum, sitzung: sitzungNum, date: isoDate };
}

function extractSpeech(
  rede: XmlNode,
  session: SessionRecord,
  topNumber: number | null,
  mpByExtId: Map<string, MpRawRecord>,
): SpeechRecord | null {
  // Speech body: gather <p> paragraphs that aren't speaker-block, excluding <kommentar>.
  const paragraphs = asArray(rede.p);
  const textParts: string[] = [];
  let mpExtId: string | null = null;

  for (const p of paragraphs) {
    if (!p || typeof p !== "object") {
      // Bare-text <p> (string-typed by fast-xml-parser for trivial nodes).
      if (typeof p === "string" && p.trim()) textParts.push(p.trim());
      continue;
    }
    const klasse = readAttr(p as XmlNode, "@_klasse");
    if (klasse === "redner") {
      // First-paragraph speaker block — extract MP, do not add to text.
      const mp = extractMpFromRednerBlock(p as XmlNode);
      if (mp) {
        mpExtId = mp.extId;
        if (!mpByExtId.has(mp.extId)) mpByExtId.set(mp.extId, mp);
      }
      continue;
    }
    // Regular paragraph — pull text, strip embedded kommentar.
    const text = extractParagraphText(p as XmlNode);
    if (text) textParts.push(text);
  }

  const text = textParts
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (!text) return null;

  const wordCount = text.split(/\s+/u).filter(Boolean).length;
  return { session, mpExtId, top: topNumber, wordCount, text };
}

function extractMpFromRednerBlock(p: XmlNode): MpRawRecord | null {
  const redner = p.redner;
  if (!redner || typeof redner !== "object") return null;
  const r = redner as XmlNode;
  const extId = readAttr(r, "@_id");
  if (!extId) return null;

  const name = r.name as XmlNode | undefined;
  if (!name || typeof name !== "object") {
    return { extId, name: "Unbekannt", rawFactionName: "", role: null };
  }

  const titel = readText(name.titel);
  const vorname = readText(name.vorname);
  const nachname = readText(name.nachname);
  const fraktion = readText(name.fraktion);
  const rolle = name.rolle as XmlNode | undefined;
  const role = rolle && typeof rolle === "object" ? readText(rolle.rolle_lang) : null;

  const fullName = [titel, vorname, nachname].filter(Boolean).join(" ").trim() || "Unbekannt";

  return {
    extId,
    name: fullName,
    rawFactionName: fraktion ?? "",
    role: role && role.length > 0 ? role : null,
  };
}

/** Recursively gather text from a paragraph, skipping any <kommentar> children. */
function extractParagraphText(node: XmlNode): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@_")) continue;
    if (key === "kommentar") continue;
    if (key === "#text") {
      if (typeof value === "string") parts.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) parts.push(stringify(item));
    } else {
      parts.push(stringify(value));
    }
  }
  return parts.join(" ").replace(/\s+/gu, " ").trim();
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") return extractParagraphText(v as XmlNode);
  return "";
}

function asArray(v: unknown): unknown[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function readAttr(node: XmlNode, attr: string): string | null {
  const v = node[attr];
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
}

function readText(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "object" && v !== null && "#text" in v) {
    const t = (v as { "#text"?: unknown })["#text"];
    return typeof t === "string" ? t.trim() || null : null;
  }
  return null;
}

function parseTopNumber(topId: string | null): number | null {
  if (!topId) return null;
  // Patterns: "TOP 5", "5", "TOP 12a" — we want the leading integer.
  const match = topId.match(/(\d+)/);
  return match?.[1] ? Number.parseInt(match[1], 10) : null;
}

function parseGermanDate(raw: string): string | null {
  // Bundestag XML uses DD.MM.YYYY.
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  if (!(dd && mm && yyyy)) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
