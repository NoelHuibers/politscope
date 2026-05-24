import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type FingerprintFeatures = {
  /** Mean sentence length in words, normalised to [0, 1] (cap 30 words). */
  sentenceLen: number;
  /** Type-token ratio, [0, 1]. */
  ttr: number;
  /** Emotional intensity proxy: exclamation density + first-person rate, [0, 1]. */
  emotion: number;
  /** Formality proxy: nominalisations + passive markers per 100 tokens, [0, 1]. */
  formality: number;
  /** 1 - cosine(mp_topic_dist, party_topic_dist), [0, 1]. Higher = more deviant. */
  deviation: number;
};

export type FingerprintQuarter = {
  /** Quarter key e.g. "2024-Q1". */
  q: string;
  /** Number of speeches contributing to this bucket. */
  n: number;
  features: FingerprintFeatures;
};

export type FingerprintMp = {
  extId: string;
  name: string;
  party: string;
  totalSpeeches: number;
  /** Sorted ascending by `q`. */
  quarters: FingerprintQuarter[];
};

export type FingerprintResponse = {
  /** Global sorted axis of all quarters in the seed (so grids line up across MPs). */
  axis: string[];
  mps: FingerprintMp[];
};

type RawRow = {
  ext_id: string;
  name: string;
  party: string;
  date: string;
  text: string;
  topic_id: string | null;
};

const MIN_SPEECHES_PER_QUARTER = 1;

function quarterKey(isoDate: string): string {
  const [yStr, mStr] = isoDate.split("-");
  const m = Number.parseInt(mStr ?? "1", 10);
  const q = Math.floor((m - 1) / 3) + 1;
  return `${yStr}-Q${q}`;
}

const SENTENCE_SPLIT = /[.!?]+\s+|[.!?]+$/u;
const TOKEN_SPLIT = /[^a-zäöüßÀ-ɏ]+/u;
const NOMINALISATION_SUFFIX = /(ung|heit|keit|tät|ion|tum|nis|schaft)$/u;
const PASSIVE_MARKERS = new Set([
  "wird",
  "wurde",
  "werden",
  "worden",
  "geworden",
  "wurden",
  "ist",
  "sind",
]);
const EXCLAMATION = /!/g;
const FIRST_PERSON = new Set(["ich", "mein", "meine", "meiner", "meinem", "meines", "mich", "mir"]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(TOKEN_SPLIT)
    .filter((t) => t.length > 0);
}

function meanSentenceLen(text: string): number {
  const sentences = text.split(SENTENCE_SPLIT).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  let total = 0;
  for (const s of sentences) total += tokens(s).length;
  return total / sentences.length;
}

function typeTokenRatio(toks: string[]): number {
  if (toks.length === 0) return 0;
  return new Set(toks).size / toks.length;
}

function emotionScore(text: string, toks: string[]): number {
  if (toks.length === 0) return 0;
  const exclam = text.match(EXCLAMATION)?.length ?? 0;
  let firstPerson = 0;
  for (const t of toks) if (FIRST_PERSON.has(t)) firstPerson += 1;
  return (exclam * 5 + firstPerson) / toks.length;
}

function formalityScore(toks: string[]): number {
  if (toks.length === 0) return 0;
  let nominal = 0;
  let passive = 0;
  for (const t of toks) {
    if (NOMINALISATION_SUFFIX.test(t) && t.length > 5) nominal += 1;
    if (PASSIVE_MARKERS.has(t)) passive += 1;
  }
  return (nominal + passive * 0.5) / toks.length;
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** Aggregate per-speech tokens for a quarter and compute features. */
type SpeechFeatures = { text: string; toks: string[] };

function computeFeatures(speeches: SpeechFeatures[]): Omit<FingerprintFeatures, "deviation"> {
  if (speeches.length === 0) {
    return { sentenceLen: 0, ttr: 0, emotion: 0, formality: 0 };
  }
  let sentenceSum = 0;
  let emotionSum = 0;
  let formalitySum = 0;
  const allToks: string[] = [];
  for (const s of speeches) {
    sentenceSum += meanSentenceLen(s.text);
    emotionSum += emotionScore(s.text, s.toks);
    formalitySum += formalityScore(s.toks);
    allToks.push(...s.toks);
  }
  const n = speeches.length;
  // Normalise to [0, 1] so the heatmap renders meaningful contrast across
  // typical political-speech ranges (sentence-len ~15-25 words, TTR ~0.3-0.6,
  // first-person + exclamation rate ~1-5%, nominalisation rate ~5-15%).
  return {
    sentenceLen: clamp01((sentenceSum / n - 8) / 22),
    ttr: clamp01((typeTokenRatio(allToks) - 0.2) / 0.5),
    emotion: clamp01((emotionSum / n) * 12),
    formality: clamp01((formalitySum / n) * 10),
  };
}

function cosineDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return clamp01(1 - dot / (Math.sqrt(na) * Math.sqrt(nb)));
}

function buildTopicDist(topics: (string | null)[], allTopicIds: string[]): number[] {
  const counts = new Map<string, number>();
  for (const t of topics) {
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((s, v) => s + v, 0) || 1;
  return allTopicIds.map((id) => (counts.get(id) ?? 0) / total);
}

/** Pure compute layer — separated for testability. */
export function computeFingerprints(rows: RawRow[], topN: number): FingerprintResponse {
  if (rows.length === 0) return { axis: [], mps: [] };

  // 1. Index every speech by (mp, quarter), and accumulate per-party-quarter topic dist.
  type Bucket = {
    extId: string;
    name: string;
    party: string;
    q: string;
    speeches: SpeechFeatures[];
    topics: (string | null)[];
  };
  const byMpQ = new Map<string, Bucket>();
  const byPartyQ = new Map<string, (string | null)[]>();
  const allQuarters = new Set<string>();
  const allTopicIds = new Set<string>();

  for (const row of rows) {
    const q = quarterKey(row.date);
    allQuarters.add(q);
    if (row.topic_id) allTopicIds.add(row.topic_id);
    const key = `${row.ext_id}__${q}`;
    const existing = byMpQ.get(key);
    const toks = tokens(row.text);
    if (existing) {
      existing.speeches.push({ text: row.text, toks });
      existing.topics.push(row.topic_id);
    } else {
      byMpQ.set(key, {
        extId: row.ext_id,
        name: row.name,
        party: row.party,
        q,
        speeches: [{ text: row.text, toks }],
        topics: [row.topic_id],
      });
    }
    const partyKey = `${row.party}__${q}`;
    const ptopics = byPartyQ.get(partyKey);
    if (ptopics) ptopics.push(row.topic_id);
    else byPartyQ.set(partyKey, [row.topic_id]);
  }

  const topicIdList = [...allTopicIds].sort();
  const partyDist = new Map<string, number[]>();
  for (const [partyKey, topics] of byPartyQ) {
    partyDist.set(partyKey, buildTopicDist(topics, topicIdList));
  }

  // 2. For each bucket compute features + deviation.
  type MpAgg = {
    extId: string;
    name: string;
    party: string;
    totalSpeeches: number;
    quarters: FingerprintQuarter[];
  };
  const mpAggs = new Map<string, MpAgg>();
  for (const bucket of byMpQ.values()) {
    if (bucket.speeches.length < MIN_SPEECHES_PER_QUARTER) continue;
    const base = computeFeatures(bucket.speeches);
    const mpDist = buildTopicDist(bucket.topics, topicIdList);
    const partyVec = partyDist.get(`${bucket.party}__${bucket.q}`) ?? [];
    const deviation = cosineDistance(mpDist, partyVec);
    const q: FingerprintQuarter = {
      q: bucket.q,
      n: bucket.speeches.length,
      features: { ...base, deviation },
    };
    const agg = mpAggs.get(bucket.extId);
    if (agg) {
      agg.quarters.push(q);
      agg.totalSpeeches += bucket.speeches.length;
    } else {
      mpAggs.set(bucket.extId, {
        extId: bucket.extId,
        name: bucket.name,
        party: bucket.party,
        totalSpeeches: bucket.speeches.length,
        quarters: [q],
      });
    }
  }

  // 3. Sort each MP's quarters ascending, then pick top-N MPs by total speeches.
  const mps: FingerprintMp[] = [...mpAggs.values()]
    .map((m) => ({ ...m, quarters: m.quarters.sort((a, b) => a.q.localeCompare(b.q)) }))
    .sort((a, b) => b.totalSpeeches - a.totalSpeeches)
    .slice(0, topN);

  const axis = [...allQuarters].sort();
  return { axis, mps };
}

/** Top-N MPs by speech count, each with their per-quarter fingerprint. */
export const getMpFingerprints = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { topN: number; extId: string | null } => {
    if (typeof input !== "object" || input === null) return { topN: 8, extId: null };
    const obj = input as { topN?: unknown; extId?: unknown };
    let topN = 8;
    if (typeof obj.topN === "number" && Number.isFinite(obj.topN)) {
      topN = Math.max(1, Math.min(50, Math.floor(obj.topN)));
    }
    const extId = typeof obj.extId === "string" && obj.extId.length > 0 ? obj.extId : null;
    return { topN, extId };
  })
  .handler(async ({ data }): Promise<FingerprintResponse> => {
    const extIdFilter = data.extId === null ? sql`` : sql`AND m.ext_id = ${data.extId}`;
    const rows = await db.execute<RawRow>(sql`
      SELECT m.ext_id, m.name, m.party::text AS party,
             s.date::text AS date, sp.text, sp.topic_id
      FROM speeches sp
      JOIN sessions s ON sp.session_id = s.id
      JOIN mps m ON sp.mp_id = m.id
      WHERE 1 = 1 ${extIdFilter}
    `);
    return computeFingerprints(rows.rows, data.extId ? 50 : data.topN);
  });
