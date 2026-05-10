export type WahlperiodeId = 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;

export type Period = {
  id: WahlperiodeId;
  label: string;
  years: string;
};

export const PERIODS: readonly Period[] = [
  { id: 12, label: "12. WP", years: "1990–94" },
  { id: 13, label: "13. WP", years: "1994–98" },
  { id: 14, label: "14. WP", years: "1998–02" },
  { id: 15, label: "15. WP", years: "2002–05" },
  { id: 16, label: "16. WP", years: "2005–09" },
  { id: 17, label: "17. WP", years: "2009–13" },
  { id: 18, label: "18. WP", years: "2013–17" },
  { id: 19, label: "19. WP", years: "2017–21" },
  { id: 20, label: "20. WP", years: "2021–25" },
  { id: 21, label: "21. WP", years: "2025–" },
] as const;
