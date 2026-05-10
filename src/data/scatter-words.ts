export type ScatterWord = {
  /** German word or phrase */
  w: string;
  /** Axis position [-1..1] — default axis Grüne ↔ AfD */
  x: number;
  /** Frequency, log-ish y position 0..1 */
  f: number;
  /** Optional explicit attribution for tooltip */
  ex?: string;
};

export const SCATTER_WORDS: readonly ScatterWord[] = [
  { w: "Remigration", x: 0.94, f: 0.72, ex: "AfD" },
  { w: "Altparteien", x: 0.91, f: 0.68 },
  { w: "Heimat", x: 0.78, f: 0.81 },
  { w: "illegale Migration", x: 0.86, f: 0.74 },
  { w: "Volk", x: 0.74, f: 0.85 },
  { w: "Genderwahn", x: 0.93, f: 0.51 },
  { w: "Souveränität", x: 0.62, f: 0.66 },
  { w: "Asyltourismus", x: 0.88, f: 0.42 },
  { w: "Leitkultur", x: 0.71, f: 0.58 },
  { w: "Schutz der Grenzen", x: 0.66, f: 0.61 },
  { w: "Klimagerechtigkeit", x: -0.92, f: 0.78 },
  { w: "Transformation", x: -0.74, f: 0.84 },
  { w: "intersektional", x: -0.91, f: 0.46 },
  { w: "Vielfalt", x: -0.78, f: 0.79 },
  { w: "Energiewende", x: -0.66, f: 0.88 },
  { w: "fossil", x: -0.81, f: 0.71 },
  { w: "Geflüchtete", x: -0.86, f: 0.73 },
  { w: "Pariser Abkommen", x: -0.74, f: 0.62 },
  { w: "marginalisiert", x: -0.88, f: 0.48 },
  { w: "ökologisch", x: -0.69, f: 0.74 },
  { w: "Sicherheit", x: 0.21, f: 0.94 },
  { w: "Wirtschaft", x: 0.18, f: 0.92 },
  { w: "Bürger", x: 0.32, f: 0.91 },
  { w: "Familie", x: 0.06, f: 0.86 },
  { w: "Zukunft", x: -0.14, f: 0.93 },
  { w: "Verantwortung", x: -0.04, f: 0.89 },
  { w: "Freiheit", x: 0.28, f: 0.84 },
  { w: "Demokratie", x: -0.08, f: 0.95 },
  { w: "Arbeitsplätze", x: 0.16, f: 0.78 },
  { w: "Generation", x: -0.22, f: 0.74 },
  { w: "Steuerzahler", x: 0.41, f: 0.62 },
  { w: "Investitionen", x: -0.18, f: 0.81 },
  { w: "Kinder", x: -0.06, f: 0.79 },
] as const;
