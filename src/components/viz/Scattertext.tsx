import { PARTY, type PartyId } from "@/data/parties";
import { SCATTER_WORDS } from "@/data/scatter-words";

const noop = (_w: string | null): void => undefined;

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  partyA?: PartyId;
  partyB?: PartyId;
  hoveredW?: string | null;
  onHover?: (w: string | null) => void;
};

export function Scattertext({
  width = 340,
  height = 280,
  dark = false,
  partyA = "afd",
  partyB = "grn",
  hoveredW = null,
  onHover,
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
        fill={A.id === "cdu" ? "var(--ink)" : A.colorVar}
        textAnchor="start"
      >
        ← typischer für {A.name}
      </text>
      <text
        x={W - pad.r}
        y={H - 10}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fontWeight={500}
        fill={B.id === "cdu" ? "var(--ink)" : B.colorVar}
        textAnchor="end"
      >
        typischer für {B.name} →
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

      {SCATTER_WORDS.map((s) => {
        const sz = 9 + s.f * 5;
        const isHi = hoveredW === s.w;
        const dim = hoveredW && hoveredW !== s.w;
        const fill =
          s.x > 0.4
            ? B.colorVar
            : s.x < -0.4
              ? A.id === "cdu"
                ? "var(--ink)"
                : A.colorVar
              : "var(--muted)";
        return (
          <text
            key={s.w}
            x={X(s.x)}
            y={Y(s.f)}
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
      })}
    </svg>
  );
}
