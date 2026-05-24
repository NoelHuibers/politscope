import { Link, useParams } from "@tanstack/react-router";
import { type MP, MPS } from "@/data/mps";
import { PARTY, type PartyId } from "@/data/parties";
import type { FingerprintMp, FingerprintResponse } from "@/lib/server/fingerprint";

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  mps?: readonly MP[];
  /** When provided, renders real per-quarter features instead of mock noise. */
  realData?: FingerprintResponse | null;
  /** Number of columns in the grid. Default 4. Use 1 for single-MP profile view. */
  columns?: number;
};

const FEATURES = [
  { key: "sentenceLen", label: "Satzlänge" },
  { key: "ttr", label: "Lex. Reichtum" },
  { key: "emotion", label: "Emotionalität" },
  { key: "formality", label: "Formalität" },
  { key: "deviation", label: "Partei-Abweichung" },
] as const;

const PALETTE = [
  "var(--color-seq-1)",
  "var(--color-seq-2)",
  "var(--color-seq-3)",
  "var(--color-seq-4)",
  "var(--accent)",
];

type FeatureKey = (typeof FEATURES)[number]["key"];

type Row = {
  id: string;
  name: string;
  party: PartyId;
  /** features × quarters; 0-1 cells, `null` when MP didn't speak in that quarter. */
  cells: (number | null)[][];
  axis: string[];
};

function pseudoRandomCells(mi: number): (number | null)[][] {
  const PERIODS_QUARTERS = 16;
  return FEATURES.map((_, fi) => {
    const arr: (number | null)[] = [];
    let v = 0.5;
    for (let i = 0; i < PERIODS_QUARTERS; i++) {
      const seed = (mi * 17 + fi * 31 + i * 7) % 233;
      v = Math.max(0.05, Math.min(0.95, v + ((seed % 100) / 100 - 0.5) * 0.18));
      arr.push(v);
    }
    return arr;
  });
}

function realCellsFor(
  mp: FingerprintMp,
  axis: string[],
): { cells: (number | null)[][]; rangeLabel: string } {
  // For each feature, build an array aligned with the global quarter axis.
  // Quarters where the MP didn't speak are `null` (rendered as empty).
  const byQ = new Map(mp.quarters.map((q) => [q.q, q]));
  const cells = FEATURES.map(({ key }) => {
    const k = key as FeatureKey;
    return axis.map((q) => byQ.get(q)?.features[k] ?? null);
  });
  const first = mp.quarters[0]?.q;
  const last = mp.quarters[mp.quarters.length - 1]?.q;
  const rangeLabel = first && last ? `${first} → ${last}` : "";
  return { cells, rangeLabel };
}

export function FingerprintGrid({ width = 660, mps, realData = null, columns = 4 }: Props) {
  const params = useParams({ strict: false });
  const locale = (params.locale as string | undefined) ?? "de";

  // Decide what to render. Real data uses ext-ids; mock uses MP.id slugs.
  const useReal = realData !== null && realData.mps.length > 0;
  const list: readonly MP[] = useReal
    ? []
    : (mps ?? MPS.filter((m) => m.note !== "thin").slice(0, 8));

  const rows: Row[] = useReal
    ? realData.mps.map((m) => {
        const { cells } = realCellsFor(m, realData.axis);
        return {
          id: m.extId,
          name: m.name,
          party: m.party as PartyId,
          cells,
          axis: realData.axis,
        };
      })
    : list.map((m, i) => ({
        id: m.id,
        name: m.name,
        party: m.party,
        cells: pseudoRandomCells(i),
        axis: Array.from({ length: 16 }).map((_, k) => `Q${k + 1}`),
      }));

  const tile = { w: width / columns - 8, h: columns === 1 ? 160 : 76 };

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 12,
      }}
    >
      {rows.map((r) => {
        const party = PARTY[r.party];
        const cellsW = Math.max(r.axis.length, 1);
        const first = r.axis[0] ?? "";
        const last = r.axis[r.axis.length - 1] ?? "";
        const rangeLabel = first && last ? `${first} → ${last}` : "";
        return (
          <Link
            key={r.id}
            to="/$locale/abgeordnete/$id"
            params={{ locale, id: r.id }}
            style={{
              background: "var(--panel-2)",
              borderRadius: 4,
              padding: "8px 9px 10px",
              border: "1px solid var(--hairline)",
              display: "block",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              transition: "border-color 120ms ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: party.shape === "square" ? 1 : "50%",
                  background: party.colorVar,
                  border: r.party === "cdu" ? `1px solid ${party.ringVar ?? "transparent"}` : "0",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {r.name}
              </span>
            </div>
            <svg
              width="100%"
              height={tile.h}
              viewBox={`0 0 ${tile.w} ${tile.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {FEATURES.map((feat, fi) => {
                const rowH = tile.h / FEATURES.length;
                const cellW = tile.w / cellsW;
                const row = r.cells[fi] ?? [];
                return (
                  <g key={feat.key}>
                    {row.map((v, i) =>
                      v === null ? null : (
                        <rect
                          key={`${feat.key}-${r.axis[i] ?? i}`}
                          x={i * cellW}
                          y={fi * rowH}
                          width={cellW - 0.4}
                          height={rowH - 0.6}
                          fill={PALETTE[fi % PALETTE.length]}
                          opacity={0.18 + v * 0.78}
                        />
                      ),
                    )}
                  </g>
                );
              })}
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.key}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8.5,
                    color: "var(--muted)",
                    letterSpacing: "0.02em",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{f.label}</span>
                  <span>{i === FEATURES.length - 1 ? rangeLabel : ""}</span>
                </div>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
