export type Debate = {
  /** Sitzung date — German formatted */
  date: string;
  title: string;
  /** Number of speeches in this debate */
  n: number;
  /** Hot/breaking topic flag for the dot indicator */
  hot?: boolean;
};

export const RECENT_DEBATES: readonly Debate[] = [
  { date: "12. Mai 2026", title: "Aktuelle Stunde: Lage in der Ukraine", n: 38, hot: true },
  { date: "12. Mai 2026", title: "Bundeswehrbeschaffungsgesetz, 2. Lesung", n: 24 },
  { date: "11. Mai 2026", title: "Anhörung Klimaanpassung", n: 17 },
  { date: "08. Mai 2026", title: "Regierungserklärung: Migrationsabkommen", n: 41 },
  { date: "07. Mai 2026", title: "Haushaltswoche, Einzelplan 14", n: 56 },
] as const;
