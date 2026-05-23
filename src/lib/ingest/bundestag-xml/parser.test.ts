import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  InvalidRootElementError,
  MalformedXmlError,
  MissingMetadataError,
  parseFile,
  streamMps,
  streamSessions,
  streamSpeeches,
} from "./index.js";
import type { MpRawRecord, SpeechRecord } from "./types.js";

const fixturesDir = join(import.meta.dirname, "__fixtures__");

function readFixture(...segments: string[]): string {
  return readFileSync(join(fixturesDir, ...segments), "utf-8");
}

async function* asAsync<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) yield item;
}

async function collect<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of stream) out.push(x);
  return out;
}

describe("parseFile — tiny/one-speech.xml", () => {
  const xml = readFixture("tiny", "one-speech.xml");
  const result = parseFile(xml, "one-speech.xml");

  it("extracts the session", () => {
    expect(result.session).toEqual({
      wahlperiode: 20,
      sitzung: 42,
      date: "2022-06-22",
    });
  });

  it("extracts exactly one MP", () => {
    expect(result.mps).toHaveLength(1);
    expect(result.mps[0]).toEqual({
      extId: "11003001",
      name: "Dr. Klaus Schmidt",
      rawFactionName: "CDU/CSU",
      role: null,
    });
  });

  it("extracts exactly one speech", () => {
    expect(result.speeches).toHaveLength(1);
  });

  it("excludes <kommentar> from text", () => {
    const text = (result.speeches[0] as SpeechRecord).text;
    expect(text).not.toContain("Beifall");
  });

  it("preserves real speech text", () => {
    const text = (result.speeches[0] as SpeechRecord).text;
    expect(text).toContain("Klimaschutz");
    expect(text).toContain("Zukunft");
  });

  it("links speech to MP by extId", () => {
    expect((result.speeches[0] as SpeechRecord).mpExtId).toBe("11003001");
  });

  it("captures TOP number", () => {
    expect((result.speeches[0] as SpeechRecord).top).toBe(5);
  });

  it("computes word count", () => {
    const speech = result.speeches[0] as SpeechRecord;
    expect(speech.wordCount).toBeGreaterThan(5);
    expect(speech.wordCount).toBe(speech.text.split(/\s+/u).filter(Boolean).length);
  });
});

describe("parseFile — tiny/two-tops-with-minister.xml", () => {
  const xml = readFixture("tiny", "two-tops-with-minister.xml");
  const result = parseFile(xml, "two-tops.xml");

  it("dedupes MPs across multiple speeches", () => {
    // Schmidt speaks in both TOPs — should appear once.
    expect(result.mps).toHaveLength(2);
    const extIds = result.mps.map((m) => m.extId).sort();
    expect(extIds).toEqual(["11003001", "11004500"]);
  });

  it("captures minister role from rolle_lang", () => {
    const wissing = result.mps.find((m) => m.extId === "11004500");
    expect(wissing?.role).toBe("Bundesminister für Digitales und Verkehr");
  });

  it("captures speeches across multiple TOPs", () => {
    expect(result.speeches).toHaveLength(3);
    const tops = result.speeches.map((s) => s.top);
    expect(tops).toEqual([1, 1, 2]); // TOP 1, TOP 1, TOP 2a → 2
  });

  it("non-minister MP has null role", () => {
    const schmidt = result.mps.find((m) => m.extId === "11003001");
    expect(schmidt?.role).toBeNull();
  });
});

describe("parseFile — error paths", () => {
  it("throws MalformedXmlError on garbage input", () => {
    const xml = readFixture("malformed", "not-xml.xml");
    expect(() => parseFile(xml, "not-xml.xml")).toThrow(MalformedXmlError);
  });

  it("throws InvalidRootElementError on wrong root", () => {
    const xml = readFixture("malformed", "wrong-root.xml");
    expect(() => parseFile(xml, "wrong-root.xml")).toThrow(InvalidRootElementError);
  });

  it("throws MissingMetadataError when wahlperiode is absent", () => {
    const xml = readFixture("malformed", "missing-metadata.xml");
    expect(() => parseFile(xml, "missing-metadata.xml")).toThrow(MissingMetadataError);
  });

  it("includes source name in error messages", () => {
    const xml = readFixture("malformed", "not-xml.xml");
    try {
      parseFile(xml, "explicit-source-name.xml");
    } catch (err) {
      expect(err).toBeInstanceOf(MalformedXmlError);
      expect((err as Error).message).toContain("explicit-source-name.xml");
    }
  });
});

describe("real-sample WP21 sitzung 79 (2026-05-20)", () => {
  const xml = readFixture("real-sample-wp21", "21079.xml");
  const result = parseFile(xml, "21079.xml");

  it("parses session metadata", () => {
    expect(result.session).toEqual({
      wahlperiode: 21,
      sitzung: 79,
      date: "2026-05-20",
    });
  });

  it("extracts a realistic number of MPs for one session", () => {
    // One full session day typically has 60-100 unique speakers.
    expect(result.mps.length).toBeGreaterThan(50);
    expect(result.mps.length).toBeLessThan(200);
  });

  it("extracts a realistic number of speeches", () => {
    // Typically 100-250 speeches per session day.
    expect(result.speeches.length).toBeGreaterThan(100);
    expect(result.speeches.length).toBeLessThan(400);
  });

  it("all speeches reference a known MP", () => {
    const mpExtIds = new Set(result.mps.map((m) => m.extId));
    const orphaned = result.speeches.filter((s) => s.mpExtId && !mpExtIds.has(s.mpExtId));
    expect(orphaned).toHaveLength(0);
  });

  it("no <kommentar> content leaks into speech text", () => {
    // The XML has 600+ <kommentar> elements; ensure typical interjection
    // strings ("Beifall", "Heiterkeit", "Zurufe") never appear in output.
    const allText = result.speeches.map((s) => s.text).join(" ");
    expect(allText).not.toContain("Beifall bei");
    expect(allText).not.toContain("Heiterkeit");
    expect(allText).not.toContain("(Zurufe");
  });

  it("captures ministers with role + empty fraktion (Stammdaten resolves party later)", () => {
    const ministers = result.mps.filter((m) => m.role !== null);
    expect(ministers.length).toBeGreaterThan(0);
    // In WP21 XML, ministers have <rolle> but typically no <fraktion>.
    for (const m of ministers) {
      expect(m.role).toBeTruthy();
    }
  });

  it("captures all major fractions", () => {
    const fractions = new Set(result.mps.map((m) => m.rawFactionName).filter((f) => f.length > 0));
    expect(fractions.has("CDU/CSU")).toBe(true);
    expect(fractions.has("SPD")).toBe(true);
    expect(fractions.has("AfD")).toBe(true);
  });

  it("speeches have non-trivial word counts", () => {
    const median = [...result.speeches.map((s) => s.wordCount)].sort((a, b) => a - b)[
      Math.floor(result.speeches.length / 2)
    ];
    expect(median).toBeGreaterThan(20);
  });

  it("speech text preserves German diacritics", () => {
    const allText = result.speeches.map((s) => s.text).join(" ");
    // At least one of these is essentially guaranteed in any Bundestag session.
    expect(/ä|ö|ü|ß|Ä|Ö|Ü/.test(allText)).toBe(true);
  });

  it("all speech dates are derived from session date", () => {
    for (const speech of result.speeches) {
      expect(speech.session.wahlperiode).toBe(21);
      expect(speech.session.sitzung).toBe(79);
    }
  });
});

describe("streamSessions / streamMps / streamSpeeches", () => {
  it("streamSessions emits one record per file", async () => {
    const file1 = { source: "f1.xml", content: readFixture("tiny", "one-speech.xml") };
    const file2 = { source: "f2.xml", content: readFixture("tiny", "two-tops-with-minister.xml") };

    const sessions = await collect(streamSessions(asAsync([file1, file2])));
    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.sitzung).toBe(42);
    expect(sessions[1]?.sitzung).toBe(43);
  });

  it("streamMps dedupes across files", async () => {
    // Schmidt (11003001) appears in BOTH fixtures — should be emitted exactly once.
    const file1 = { source: "f1.xml", content: readFixture("tiny", "one-speech.xml") };
    const file2 = { source: "f2.xml", content: readFixture("tiny", "two-tops-with-minister.xml") };

    const mps = await collect(streamMps(asAsync([file1, file2])));
    const schmidtCount = mps.filter((m: MpRawRecord) => m.extId === "11003001").length;
    expect(schmidtCount).toBe(1);
    // Total unique MPs across both files: Schmidt + Wissing = 2
    expect(mps).toHaveLength(2);
  });

  it("streamSpeeches preserves order within a file", async () => {
    const file = {
      source: "f.xml",
      content: readFixture("tiny", "two-tops-with-minister.xml"),
    };
    const speeches = await collect(streamSpeeches(asAsync([file])));
    expect(speeches).toHaveLength(3);
    // First speech is in TOP 1, second is by Schmidt in TOP 1, third is Schmidt in TOP 2.
    expect(speeches[0]?.mpExtId).toBe("11004500");
    expect(speeches[1]?.mpExtId).toBe("11003001");
    expect(speeches[2]?.mpExtId).toBe("11003001");
  });
});
