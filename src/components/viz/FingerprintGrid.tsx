import { Link, useParams } from "@tanstack/react-router";
import { PARTY, type PartyId } from "@/data/parties";
import type { FingerprintMp, FingerprintResponse } from "@/lib/server/fingerprint";

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  realData: FingerprintResponse;
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

function realCellsFor(mp: FingerprintMp, axis: string[]): (number | null)[][] {
  // For each feature, build an array aligned with the global quarter axis.
  // Quarters where the MP didn't speak are `null` (rendered as empty).
  const byQ = new Map(mp.quarters.map((q) => [q.q, q]));
  return FEATURES.map(({ key }) => {
    const k = key as FeatureKey;
    return axis.map((q) => byQ.get(q)?.features[k] ?? null);
  });
}

export function FingerprintGrid({ width = 660, realData, columns = 4 }: Props) {
  const params = useParams({ strict: false });
  const locale = (params.locale as string | undefined) ?? "de";

  const rows: Row[] = realData.mps.map((m) => ({
    id: m.extId,
    name: m.name,
    party: m.party as PartyId,
    cells: realCellsFor(m, realData.axis),
    axis: realData.axis,
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
