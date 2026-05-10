export type TopicId =
  | "wirt"
  | "umw"
  | "mig"
  | "auss"
  | "soz"
  | "bil"
  | "dig"
  | "vert"
  | "haus"
  | "verk"
  | "just"
  | "eu"
  | "land"
  | "ges";

export type Topic = {
  id: TopicId;
  label: string;
  /** UMAP-projected center, normalized to -1..1 */
  x: number;
  y: number;
  /** Speeches in this cluster */
  n: number;
};

export const TOPICS: readonly Topic[] = [
  { id: "wirt", label: "Wirtschaft", x: 0.55, y: 0.1, n: 142_310 },
  { id: "umw", label: "Umwelt & Klima", x: -0.55, y: -0.45, n: 118_402 },
  { id: "mig", label: "Migration", x: 0.1, y: 0.65, n: 76_544 },
  { id: "auss", label: "Außenpolitik", x: 0.7, y: -0.55, n: 98_211 },
  { id: "soz", label: "Soziales", x: -0.65, y: 0.35, n: 154_009 },
  { id: "bil", label: "Bildung", x: -0.2, y: 0.2, n: 41_220 },
  { id: "dig", label: "Digitalisierung", x: 0.3, y: -0.2, n: 29_877 },
  { id: "vert", label: "Verteidigung", x: 0.85, y: -0.2, n: 44_180 },
  { id: "haus", label: "Haushalt", x: 0.4, y: 0.4, n: 87_633 },
  { id: "verk", label: "Verkehr", x: -0.4, y: -0.1, n: 33_410 },
  { id: "just", label: "Justiz & Inneres", x: 0.05, y: 0.4, n: 62_180 },
  { id: "eu", label: "Europa", x: 0.35, y: -0.65, n: 71_000 },
  { id: "land", label: "Landwirtschaft", x: -0.75, y: -0.1, n: 22_980 },
  { id: "ges", label: "Gesundheit", x: -0.1, y: 0.55, n: 58_320 },
] as const;

/** Topic-level Sankey flows (1990 → 2025) — speech-share % per topic per legislative period */
export const TOPIC_FLOWS: Record<TopicId, readonly number[]> = {
  wirt: [22, 21, 19, 18, 17, 19, 16, 15, 14, 14],
  soz: [18, 17, 16, 16, 15, 14, 13, 13, 12, 12],
  auss: [14, 13, 11, 12, 11, 10, 11, 10, 9, 11],
  haus: [11, 10, 10, 10, 9, 9, 9, 9, 9, 8],
  umw: [4, 5, 7, 7, 8, 10, 11, 14, 17, 16],
  mig: [3, 4, 4, 4, 5, 4, 6, 10, 9, 10],
  vert: [7, 6, 6, 5, 5, 4, 4, 4, 6, 8],
  eu: [6, 7, 9, 9, 9, 8, 8, 6, 6, 5],
  ges: [4, 5, 5, 6, 6, 6, 6, 5, 6, 6],
  just: [4, 4, 4, 4, 4, 5, 5, 5, 4, 4],
  bil: [2, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  dig: [0, 0, 1, 1, 2, 3, 3, 3, 2, 2],
  verk: [3, 3, 3, 3, 3, 3, 3, 2, 2, 2],
  land: [2, 2, 2, 2, 2, 2, 2, 1, 1, 1],
} as const;
