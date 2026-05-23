import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { MpRawRecord } from "../bundestag-xml/types.js";
import { InvalidStammdatenRootError, StammdatenParseError } from "./errors.js";
import { parseStammdaten } from "./parser.js";
import { mapParty } from "./party-map.js";
import { resolveMps } from "./resolver.js";

const fixturesDir = join(import.meta.dirname, "__fixtures__");

function readFixture(...segments: string[]): string {
  return readFileSync(join(fixturesDir, ...segments), "utf-8");
}

describe("mapParty", () => {
  it("maps modern parties correctly", () => {
    expect(mapParty("CDU")).toBe("cdu");
    expect(mapParty("CSU")).toBe("csu");
    expect(mapParty("SPD")).toBe("spd");
    expect(mapParty("FDP")).toBe("fdp");
    expect(mapParty("AfD")).toBe("afd");
    expect(mapParty("BSW")).toBe("bsw");
  });

  it("maps Greens variants to grn", () => {
    expect(mapParty("GRÜNE")).toBe("grn");
    expect(mapParty("BÜNDNIS 90/DIE GRÜNEN")).toBe("grn");
    expect(mapParty("DIE GRÜNEN/BÜNDNIS 90")).toBe("grn");
    expect(mapParty("B90/GRÜNE")).toBe("grn");
  });

  it("maps Left/PDS variants to lnk", () => {
    expect(mapParty("DIE LINKE.")).toBe("lnk");
    expect(mapParty("DIE LINKE")).toBe("lnk");
    expect(mapParty("LINKE")).toBe("lnk");
    expect(mapParty("PDS")).toBe("lnk");
  });

  it("maps independent / unaffiliated to none", () => {
    expect(mapParty("fraktionslos")).toBe("none");
    expect(mapParty("parteilos")).toBe("none");
    expect(mapParty("Plos")).toBe("none");
    expect(mapParty("")).toBe("none");
    expect(mapParty(null)).toBe("none");
    expect(mapParty(undefined)).toBe("none");
  });

  it("returns none for unrecognised party (with whitespace tolerance)", () => {
    expect(mapParty("MADE_UP_PARTY")).toBe("none");
    expect(mapParty("  CDU  ")).toBe("cdu");
  });
});

describe("parseStammdaten — curated tiny fixture", () => {
  const xml = readFixture("tiny", "stammdaten-curated.xml");
  const lookup = parseStammdaten(xml, "tiny/stammdaten-curated.xml");

  it("parses the expected number of MPs", () => {
    expect(lookup.size).toBe(6);
  });

  it("returns a Map keyed by 8-digit extId", () => {
    for (const extId of lookup.keys()) {
      expect(extId).toMatch(/^\d{8}$/);
    }
  });

  it("populates canonical names with title + given + surname", () => {
    // 11005228 = Dr. Till Steffen
    const steffen = lookup.get("11005228");
    expect(steffen?.canonicalName).toContain("Till");
    expect(steffen?.canonicalName).toContain("Steffen");
  });

  it("resolves party from PARTEI_KURZ to enum", () => {
    const steffen = lookup.get("11005228");
    expect(steffen?.party).toBe("grn");
    const peterka = lookup.get("11004850");
    expect(peterka?.party).toBe("afd");
  });

  it("captures wahlperioden list sorted ascending", () => {
    for (const mp of lookup.values()) {
      const wps = mp.wahlperioden;
      const sorted = [...wps].sort((a, b) => a - b);
      expect(wps).toEqual(sorted);
    }
  });

  it("derives sinceYear from earliest WAHLPERIODE", () => {
    for (const mp of lookup.values()) {
      expect(mp.sinceYear).not.toBeNull();
      expect(mp.sinceYear).toBeGreaterThan(1949);
      expect(mp.sinceYear).toBeLessThan(2030);
    }
  });

  it("keeps the raw PARTEI_KURZ value for diagnostics", () => {
    for (const mp of lookup.values()) {
      expect(typeof mp.rawParteiKurz).toBe("string");
    }
  });
});

describe("parseStammdaten — error paths", () => {
  it("throws on malformed XML", () => {
    expect(() => parseStammdaten("not xml at all <broken", "bad.xml")).toThrow(
      StammdatenParseError,
    );
  });

  it("throws InvalidStammdatenRootError on wrong root element", () => {
    const xml = '<?xml version="1.0"?><WRONG_ROOT><foo/></WRONG_ROOT>';
    expect(() => parseStammdaten(xml, "wrong.xml")).toThrow(InvalidStammdatenRootError);
  });
});

describe("resolveMps", () => {
  const xml = readFixture("tiny", "stammdaten-curated.xml");
  const lookup = parseStammdaten(xml, "fixture");

  it("resolves all matching raw MPs", () => {
    const raw: MpRawRecord[] = [
      {
        extId: "11005228",
        name: "Dr. Till Steffen",
        rawFactionName: "BÜNDNIS 90/DIE GRÜNEN",
        role: null,
      },
      {
        extId: "11004850",
        name: "Tobias Matthias Peterka",
        rawFactionName: "AfD",
        role: null,
      },
    ];

    const { resolved, unmatched } = resolveMps(raw, lookup);
    expect(resolved).toHaveLength(2);
    expect(unmatched).toHaveLength(0);
    const steffen = resolved.find((m) => m.extId === "11005228");
    expect(steffen?.party).toBe("grn");
    expect(steffen?.since).not.toBeNull();
  });

  it("preserves role from raw protocol record (Stammdaten doesn't have minister positions)", () => {
    const raw: MpRawRecord[] = [
      {
        extId: "11005006",
        name: "Reem Alabali Radovan",
        rawFactionName: "",
        role: "Bundesministerin für wirtschaftliche Zusammenarbeit und Entwicklung",
      },
    ];

    const { resolved } = resolveMps(raw, lookup);
    expect(resolved[0]?.role).toBe(
      "Bundesministerin für wirtschaftliche Zusammenarbeit und Entwicklung",
    );
  });

  it("resolves minister party from Stammdaten when protocol fraktion is empty (key win of #13)", () => {
    // Alabali Radovan speaks as minister with empty <fraktion> in the protocol XML.
    // Stammdaten knows her actual party — resolver should use that.
    const raw: MpRawRecord[] = [
      {
        extId: "11005006",
        name: "Reem Alabali Radovan",
        rawFactionName: "", // empty in protocol because she spoke as minister
        role: "Bundesministerin",
      },
    ];

    const { resolved } = resolveMps(raw, lookup);
    expect(resolved[0]?.party).not.toBe("none");
  });

  it("collects unmatched MPs without dropping them silently", () => {
    const raw: MpRawRecord[] = [
      { extId: "99999999", name: "Imaginary MP", rawFactionName: "FAKE", role: null },
    ];

    const { resolved, unmatched } = resolveMps(raw, lookup);
    expect(resolved).toHaveLength(0);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]?.extId).toBe("99999999");
  });

  it("uses Stammdaten canonical name, not the per-speech name from protocol", () => {
    // Protocol XML might write "Dr. T. Steffen" or similar variants — resolver normalizes.
    const raw: MpRawRecord[] = [
      {
        extId: "11005228",
        name: "T. Steffen",
        rawFactionName: "BÜNDNIS 90/DIE GRÜNEN",
        role: null,
      },
    ];

    const { resolved } = resolveMps(raw, lookup);
    expect(resolved[0]?.name).toContain("Till");
    expect(resolved[0]?.name).toContain("Steffen");
  });
});

const realStammdatenPath = join(fixturesDir, "real", "MDB_STAMMDATEN.XML");

describe.skipIf(!existsSync(realStammdatenPath))("parseStammdaten — real Stammdaten file", () => {
  const xml = readFileSync(realStammdatenPath, "utf-8");
  const lookup = parseStammdaten(xml, "real");

  it("parses thousands of MPs from the full file", () => {
    expect(lookup.size).toBeGreaterThan(4000);
    expect(lookup.size).toBeLessThan(10000);
  });

  it("all extIds are 8-digit identifiers", () => {
    for (const id of lookup.keys()) {
      expect(id).toMatch(/^\d{8}$/);
    }
  });

  it("all major modern parties are represented", () => {
    const parties = new Set([...lookup.values()].map((m) => m.party));
    expect(parties.has("cdu")).toBe(true);
    expect(parties.has("csu")).toBe(true);
    expect(parties.has("spd")).toBe(true);
    expect(parties.has("grn")).toBe(true);
    expect(parties.has("fdp")).toBe(true);
    expect(parties.has("afd")).toBe(true);
    expect(parties.has("lnk")).toBe(true);
  });

  it("CDU and CSU are distinct (the whole point of #8 resolution)", () => {
    const cdu = [...lookup.values()].filter((m) => m.party === "cdu");
    const csu = [...lookup.values()].filter((m) => m.party === "csu");
    expect(cdu.length).toBeGreaterThan(100);
    expect(csu.length).toBeGreaterThan(50);
    // Sanity check: there's no overlap of extIds (they shouldn't be possible).
    const cduIds = new Set(cdu.map((m) => m.extId));
    for (const m of csu) {
      expect(cduIds.has(m.extId)).toBe(false);
    }
  });

  it("fewer than 5% of MPs have party=none (most unrecognised parties are pre-1970 historical)", () => {
    const none = [...lookup.values()].filter((m) => m.party === "none").length;
    const ratio = none / lookup.size;
    expect(ratio).toBeLessThan(0.05);
  });
});
