import { PARTY, type PartyId } from "@/data/parties";

const noop = (_w: string | null): void => undefined;

/** Real scatter word from `getScattertext` server fn. Convention: x > 0 → partyA. */
export type ScatterRealWord = {
  word: string;
  x: number;
  f: number;
  countA: number;
  countB: number;
  totalCount: number;
};

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  partyA?: PartyId;
  partyB?: PartyId;
  hoveredW?: string | null;
  onHover?: (w: string | null) => void;
  /** LOR words from getScattertext; null = still loading. */
  realWords?: ScatterRealWord[] | null;
};

type Row = { w: string; x: number; f: number };

export function Scattertext({
  width = 340,
  height = 280,
  dark = false,
  partyA = "afd",
  partyB = "grn",
  hoveredW = null,
  onHover,
  realWords = null,
}: Props) {
  const handleHover = onHover ?? noop;
  const pad = { l: 28, r: 12, t: 22, b: 28 };
  const W = width;
  const H = height;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const X = (x: number) => pad.l + ((x + 1) / 2) * innerW;
  const Y = (f: number) => H - pad.b - f * innerH;
  const A = PARTY[partyA];
  const B = PARTY[partyB];
  const axisColor = dark ? "rgba(255,255,250,0.20)" : "rgba(20,18,12,0.18)";

  const rows: Row[] = (realWords ?? []).map((r) => ({ w: r.word, x: r.x, f: r.f }));
  const isLoading = realWords === null;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <rect
        x={pad.l}
        y={pad.t}
        width={innerW}
        height={innerH}
        fill={dark ? "rgba(255,255,250,0.015)" : "rgba(20,18,12,0.015)"}
        stroke={axisColor}
      />
      <line
        x1={X(0)}
        y1={pad.t}
        x2={X(0)}
        y2={H - pad.b}
        stroke={axisColor}
        strokeDasharray="2 3"
      />

      <text
        x={pad.l}
        y={H - 10}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fontWeight={500}
        fill={B.colorVar}
        textAnchor="start"
      >
        ← typischer für {B.name}
      </text>
      <text
        x={W - pad.r}
        y={H - 10}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fontWeight={500}
        fill={A.colorVar}
        textAnchor="end"
      >
        typischer für {A.name} →
      </text>

      <g transform={`translate(10, ${pad.t + innerH / 2}) rotate(-90)`}>
        <text
          fontFamily="var(--font-sans)"
          fontSize={10}
          fontWeight={500}
          fill="var(--muted)"
          textAnchor="middle"
        >
          Häufigkeit
        </text>
      </g>

      {(() => {
        // Greedy collision avoidance: sort by importance (|x| × f) and place
        // each label only if its bounding rect doesn't overlap a placed one.
        type Placed = {
          row: Row;
          cx: number;
          cy: number;
          sz: number;
          rect: { x0: number; y0: number; x1: number; y1: number };
        };
        const scored = rows.map((s) => ({ s, score: Math.abs(s.x) * s.f }));
        scored.sort((a, b) => b.score - a.score);
        const placed: Placed[] = [];
        const PAD_PX = 1;
        for (const { s } of scored) {
          const sz = 9 + s.f * 5;
          const cx = X(s.x);
          const cy = Y(s.f);
          // Rough em width — fits "Wirtschaft" without measuring.
          const w = s.w.length * sz * 0.55;
          const h = sz;
          const r = {
            x0: cx - w / 2 - PAD_PX,
            y0: cy - h * 0.85,
            x1: cx + w / 2 + PAD_PX,
            y1: cy + h * 0.2,
          };
          const overlap = placed.some(
            (p) => r.x0 < p.rect.x1 && r.x1 > p.rect.x0 && r.y0 < p.rect.y1 && r.y1 > p.rect.y0,
          );
          if (overlap) continue;
          placed.push({ row: s, cx, cy, sz, rect: r });
        }
        return placed.map(({ row: s, cx, cy, sz }) => {
          const isHi = hoveredW === s.w;
          const dim = hoveredW && hoveredW !== s.w;
          const fill = s.x > 0.4 ? A.colorVar : s.x < -0.4 ? B.colorVar : "var(--muted)";
          return (
            <text
              key={s.w}
              x={cx}
              y={cy}
              fontFamily="var(--font-sans)"
              fontSize={sz}
              fontWeight={isHi ? 700 : 500}
              fill={fill}
              opacity={dim ? 0.25 : 1}
              textAnchor="middle"
              onMouseEnter={() => handleHover(s.w)}
              onMouseLeave={() => handleHover(null)}
              style={{ cursor: "pointer" }}
            >
              {s.w}
            </text>
          );
        });
      })()}

      {isLoading && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--muted)"
          style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          Lade Wortvergleich …
        </text>
      )}
    </svg>
  );
}
