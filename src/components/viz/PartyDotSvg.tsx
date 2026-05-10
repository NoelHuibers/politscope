import { PARTY, type PartyId } from "@/data/parties";

type Props = {
  cx: number;
  cy: number;
  r?: number;
  party: PartyId;
  opacity?: number;
};

/** SVG-coords variant of the party glyph — used inside scatter/positioning charts. */
export function PartyDotSvg({ cx, cy, r = 5, party, opacity = 1 }: Props) {
  const p = PARTY[party];
  if (!p) return null;

  const stroke = p.id === "cdu" ? (p.ringVar ?? "transparent") : "transparent";
  const sw = p.id === "cdu" ? 1 : 0;

  if (p.shape === "triangle") {
    const h = r * 1.6;
    return (
      <polygon
        points={`${cx},${cy - h * 0.55} ${cx - h * 0.55},${cy + h * 0.45} ${cx + h * 0.55},${cy + h * 0.45}`}
        fill={p.colorVar}
        stroke={stroke}
        strokeWidth={sw}
        opacity={opacity}
      />
    );
  }
  if (p.shape === "diamond") {
    return (
      <polygon
        points={`${cx},${cy - r * 1.2} ${cx + r * 1.1},${cy} ${cx},${cy + r * 1.2} ${cx - r * 1.1},${cy}`}
        fill={p.colorVar}
        stroke={stroke}
        strokeWidth={sw}
        opacity={opacity}
      />
    );
  }
  if (p.shape === "square") {
    return (
      <rect
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        rx={1}
        fill={p.colorVar}
        stroke={stroke}
        strokeWidth={sw}
        opacity={opacity}
      />
    );
  }
  if (p.shape === "hex") {
    const a = r * 1.05;
    const pts = [0, 60, 120, 180, 240, 300]
      .map((deg) => {
        const rad = ((deg - 30) * Math.PI) / 180;
        return `${cx + Math.cos(rad) * a},${cy + Math.sin(rad) * a}`;
      })
      .join(" ");
    return (
      <polygon points={pts} fill={p.colorVar} stroke={stroke} strokeWidth={sw} opacity={opacity} />
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={p.colorVar}
      stroke={stroke}
      strokeWidth={sw}
      opacity={opacity}
    />
  );
}
