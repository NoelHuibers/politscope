export type PartyShape = "circle" | "triangle" | "diamond" | "square" | "hex";

export type PartyId = "cdu" | "spd" | "grn" | "fdp" | "lnk" | "afd" | "csu" | "bsw";

export type RGB = readonly [number, number, number];

export type Party = {
  id: PartyId;
  name: string;
  full: string;
  /** CSS variable reference (e.g., `var(--color-p-cdu)`) so it switches with theme */
  colorVar: string;
  /** Optional ring var — used for CDU on dark mode */
  ringVar?: string;
  shape: PartyShape;
  /** Canonical RGB for WebGL contexts (deck.gl) — matches the CSS hex. */
  rgb: RGB;
  /** Override RGB for dark mode — used by CDU which would be invisible otherwise. */
  rgbDark?: RGB;
};

export const PARTIES: readonly Party[] = [
  {
    id: "cdu",
    name: "CDU",
    full: "Christlich Demokratische Union",
    colorVar: "var(--p-cdu-display, var(--color-p-cdu))",
    ringVar: "var(--p-cdu-ring, transparent)",
    shape: "circle",
    rgb: [17, 17, 17],
    rgbDark: [180, 180, 188],
  },
  {
    id: "spd",
    name: "SPD",
    full: "Sozialdemokratische Partei Deutschlands",
    colorVar: "var(--color-p-spd)",
    shape: "circle",
    rgb: [200, 16, 46],
  },
  {
    id: "grn",
    name: "Grüne",
    full: "Bündnis 90/Die Grünen",
    colorVar: "var(--color-p-grn)",
    shape: "triangle",
    rgb: [74, 138, 44],
  },
  {
    id: "fdp",
    name: "FDP",
    full: "Freie Demokratische Partei",
    colorVar: "var(--color-p-fdp)",
    shape: "diamond",
    rgb: [235, 205, 20],
  },
  {
    id: "lnk",
    name: "Linke",
    full: "Die Linke",
    colorVar: "var(--color-p-lnk)",
    shape: "square",
    rgb: [179, 20, 127],
  },
  {
    id: "afd",
    name: "AfD",
    full: "Alternative für Deutschland",
    colorVar: "var(--color-p-afd)",
    shape: "hex",
    rgb: [31, 109, 190],
  },
  {
    id: "csu",
    name: "CSU",
    full: "Christlich-Soziale Union",
    colorVar: "var(--color-p-csu)",
    shape: "circle",
    rgb: [78, 163, 216],
  },
  {
    id: "bsw",
    name: "BSW",
    full: "Bündnis Sahra Wagenknecht",
    colorVar: "var(--color-p-bsw)",
    shape: "triangle",
    rgb: [111, 78, 168],
  },
] as const;

export const PARTY: Record<PartyId, Party> = Object.fromEntries(
  PARTIES.map((p) => [p.id, p]),
) as Record<PartyId, Party>;

/** Look up the right RGB for a party in the current theme. */
export function partyRgb(id: PartyId, dark: boolean): RGB {
  const p = PARTY[id];
  if (!p) return [128, 128, 128];
  return dark && p.rgbDark ? p.rgbDark : p.rgb;
}
