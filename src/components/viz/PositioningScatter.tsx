import { MPS } from "@/data/mps";
import { PARTY, type PartyId } from "@/data/parties";
import { PartyDotSvg } from "./PartyDotSvg";

const noop = (_id: string | null): void => undefined;

/** Real positioning point — matches `PositioningMp` in src/lib/server/positioning.ts. */
export type PositioningPoint = {
  extId: string;
  name: string;
  party: string;
  ax: number;
  ay: number;
  n: number;
  isOutlier: boolean;
};

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  axisA?: PartyId;
  axisB?: PartyId;
  topic?: string;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  /** When provided, renders real MPs instead of the mock MPS. */
  realMps?: PositioningPoint[] | null;
};

type MpRow = {
  id: string;
  name: string;
  party: PartyId;
  ax: number;
  ay: number;
  isOutlier: boolean;
};

export function PositioningScatter({
  width = 360,
  height = 280,
  dark = false,
  axisA = "afd",
  axisB = "grn",
  topic = "Alle Themen",
  hoveredId = null,
  onHover,
  realMps = null,
}: Props) {
  const handleHover = onHover ?? noop;
  const pad = { l: 36, r: 12, t: 22, b: 28 };
  const W = width;
  const H = height;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const X = (ax: number) => pad.l + ((ax + 1) / 2) * innerW;
  const Y = (ay: number) => H - pad.b - ay * innerH;

  const A = PARTY[axisA];
  const B = PARTY[axisB];
  const axisColor = dark ? "rgba(255,255,250,0.20)" : "rgba(20,18,12,0.18)";

  const eligible: MpRow[] = realMps
    ? realMps.map((m) => ({
        id: m.extId,
        name: m.name,
        party: m.party as PartyId,
        ax: m.ax,
        ay: m.ay,
        isOutlier: m.isOutlier,
      }))
    : MPS.filter((m) => m.note !== "thin").map((m) => ({
        id: m.id,
        name: m.name,
        party: m.party,
        ax: m.ax,
        ay: m.ay,
        isOutlier: m.note === "outlier",
      }));

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
        fill="var(--ink-2)"
        textAnchor="start"
      >
        ← rhetorisch näher an {A.name}
      </text>
      <text
        x={W - pad.r}
        y={H - 10}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fontWeight={500}
        fill="var(--ink-2)"
        textAnchor="end"
      >
        näher an {B.name} →
      </text>

      <g transform={`translate(10, ${pad.t + innerH / 2}) rotate(-90)`}>
        <text
          fontFamily="var(--font-sans)"
          fontSize={10}
          fontWeight={500}
          fill="var(--muted)"
          textAnchor="middle"
        >
          Redebeitragsvolumen
        </text>
      </g>

      <g transform={`translate(${pad.l + 6}, ${pad.t + 6})`}>
        <rect
          x={0}
          y={0}
          width={130}
          height={20}
          rx={10}
          fill={dark ? "rgba(255,255,250,0.05)" : "rgba(20,18,12,0.05)"}
        />
        <text
          x={10}
          y={13.5}
          fontFamily="var(--font-sans)"
          fontSize={10}
          fontWeight={500}
          fill="var(--ink-2)"
        >
          Thema · {topic}
        </text>
      </g>

      {eligible.map((m) => {
        const isHi = hoveredId === m.id;
        const isDim = hoveredId && hoveredId !== m.id;
        return (
          <g
            key={m.id}
            onMouseEnter={() => handleHover(m.id)}
            onMouseLeave={() => handleHover(null)}
            style={{ cursor: "pointer" }}
          >
            {m.isOutlier && (
              <circle
                cx={X(m.ax)}
                cy={Y(m.ay)}
                r={9}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            )}
            <PartyDotSvg
              cx={X(m.ax)}
              cy={Y(m.ay)}
              r={isHi ? 6 : 4.5}
              party={m.party}
              opacity={isDim ? 0.28 : 1}
            />
            {isHi && (
              <text
                x={X(m.ax) + 9}
                y={Y(m.ay) + 3.5}
                fontFamily="var(--font-sans)"
                fontSize={11}
                fontWeight={600}
                fill="var(--ink)"
              >
                {m.name}
              </text>
            )}
          </g>
        );
      })}

      {eligible
        .filter((m) => m.isOutlier)
        .slice(0, 3)
        .map((m) => (
          <text
            key={`l-${m.id}`}
            x={X(m.ax) + 8}
            y={Y(m.ay) - 6}
            fontFamily="var(--font-sans)"
            fontSize={9.5}
            fontWeight={500}
            fill="var(--ink-2)"
            opacity={hoveredId ? 0.4 : 0.95}
          >
            {m.name.split(" ").slice(-1)[0]}
          </text>
        ))}
    </svg>
  );
}
