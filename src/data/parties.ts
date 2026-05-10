export type PartyShape = "circle" | "triangle" | "diamond" | "square" | "hex";

export type PartyId = "cdu" | "spd" | "grn" | "fdp" | "lnk" | "afd" | "csu" | "bsw";

export type Party = {
  id: PartyId;
  name: string;
  full: string;
  /** CSS variable reference (e.g., `var(--color-p-cdu)`) so it switches with theme */
  colorVar: string;
  /** Optional ring var — used for CDU on dark mode */
  ringVar?: string;
  shape: PartyShape;
};

export const PARTIES: readonly Party[] = [
  {
    id: "cdu",
    name: "CDU",
    full: "Christlich Demokratische Union",
    colorVar: "var(--p-cdu-display, var(--color-p-cdu))",
    ringVar: "var(--p-cdu-ring, transparent)",
    shape: "circle",
  },
  {
    id: "spd",
    name: "SPD",
    full: "Sozialdemokratische Partei Deutschlands",
    colorVar: "var(--color-p-spd)",
    shape: "circle",
  },
  {
    id: "grn",
    name: "Grüne",
    full: "Bündnis 90/Die Grünen",
    colorVar: "var(--color-p-grn)",
    shape: "triangle",
  },
  {
    id: "fdp",
    name: "FDP",
    full: "Freie Demokratische Partei",
    colorVar: "var(--color-p-fdp)",
    shape: "diamond",
  },
  {
    id: "lnk",
    name: "Linke",
    full: "Die Linke",
    colorVar: "var(--color-p-lnk)",
    shape: "square",
  },
  {
    id: "afd",
    name: "AfD",
    full: "Alternative für Deutschland",
    colorVar: "var(--color-p-afd)",
    shape: "hex",
  },
  {
    id: "csu",
    name: "CSU",
    full: "Christlich-Soziale Union",
    colorVar: "var(--color-p-csu)",
    shape: "circle",
  },
  {
    id: "bsw",
    name: "BSW",
    full: "Bündnis Sahra Wagenknecht",
    colorVar: "var(--color-p-bsw)",
    shape: "triangle",
  },
] as const;

export const PARTY: Record<PartyId, Party> = Object.fromEntries(
  PARTIES.map((p) => [p.id, p]),
) as Record<PartyId, Party>;
