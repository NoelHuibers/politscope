/** Real-data shape matching `TopicFlowsResponse` from src/lib/server/topic-flows.ts. */
export type RealTopicFlows = {
  periods: { id: number; label: string; total: number }[];
  bands: { topicId: string; label: string; counts: number[]; total: number }[];
};

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  mode?: "sankey" | "stream";
  highlightTopicId?: string | null;
  /** WP-share data from getTopicFlows; null = still loading. */
  realFlows?: RealTopicFlows | null;
};

/** Stable palette for real cluster-N IDs — same colors as the atlas legend. */
const CLUSTER_COLORS = [
  "var(--color-seq-1)",
  "var(--color-seq-2)",
  "var(--color-seq-3)",
  "var(--color-seq-4)",
  "var(--color-seq-5)",
  "#4a8a2c",
  "var(--accent)",
  "#b1d3c7",
  "#d6cfb8",
  "#b3d8e8",
];

function clusterColor(topicId: string): string {
  const m = /cluster-(\d+)/.exec(topicId);
  const idx = m ? Number.parseInt(m[1] ?? "0", 10) : 0;
  return CLUSTER_COLORS[idx % CLUSTER_COLORS.length] ?? CLUSTER_COLORS[0] ?? "var(--ink-2)";
}

type Band = { topicId: string; label: string; series: number[]; color: string };
type PeriodCol = { id: string | number; label: string };

export function SankeyTimeline({
  width = 660,
  height = 220,
  dark = false,
  mode = "sankey",
  highlightTopicId = null,
  realFlows = null,
}: Props) {
  // Right padding sized for German cluster labels like "erneuerbaren · merz".
  const pad = { l: 10, r: 130, t: 10, b: 22 };
  const W = width;
  const H = height;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const isLoading = realFlows === null;
  const periods: PeriodCol[] = realFlows?.periods.map((p) => ({ id: p.id, label: p.label })) ?? [];
  const bands: Band[] = (realFlows?.bands ?? [])
    .map((b) => ({
      topicId: b.topicId,
      label: b.label,
      series: [...b.counts],
      color: clusterColor(b.topicId),
    }))
    .sort((a, b) => {
      const as = a.series.reduce((s, v) => s + v, 0);
      const bs = b.series.reduce((s, v) => s + v, 0);
      return bs - as;
    });

  const nP = periods.length;
  const xAt = (i: number) => (nP === 1 ? pad.l + innerW / 2 : pad.l + (i / (nP - 1)) * innerW);

  const stackTop: { topicId: string; start: number; end: number }[][] = [];
  for (let i = 0; i < nP; i++) {
    const total = bands.reduce((s, b) => s + (b.series[i] ?? 0), 0) || 1;
    let cum = 0;
    const row = bands.map((b) => {
      const start = cum;
      cum += b.series[i] ?? 0;
      return { topicId: b.topicId, start: start / total, end: cum / total };
    });
    stackTop.push(row);
  }

  const baseAlpha = dark ? 0.72 : 0.82;
  const yScale = (s: number) => pad.t + s * innerH;

  const curve = (x1: number, y1a: number, y1b: number, x2: number, y2a: number, y2b: number) => {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1a} C ${mx} ${y1a}, ${mx} ${y2a}, ${x2} ${y2a} L ${x2} ${y2b} C ${mx} ${y2b}, ${mx} ${y1b}, ${x1} ${y1b} Z`;
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      {periods.map((p, i) => (
        <g key={p.id}>
          <line
            x1={xAt(i)}
            y1={pad.t}
            x2={xAt(i)}
            y2={H - pad.b}
            stroke={dark ? "rgba(255,255,250,0.05)" : "rgba(20,18,12,0.05)"}
          />
          <text
            x={xAt(i)}
            y={H - 6}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9.5}
            fill="var(--muted)"
          >
            {p.label}
          </text>
        </g>
      ))}

      {mode === "sankey" ? (
        <g>
          {bands.map((b) => {
            const isHi = highlightTopicId === b.topicId;
            const op = highlightTopicId ? (isHi ? 0.95 : 0.32) : baseAlpha;
            const lastRow = stackTop[nP - 1];
            const last = lastRow?.find((s) => s.topicId === b.topicId);
            const mid = last ? (last.start + last.end) / 2 : 0;
            const span = last ? last.end - last.start : 0;
            return (
              <g key={b.topicId}>
                {Array.from({ length: Math.max(0, nP - 1) }).map((_, i) => {
                  const a = stackTop[i]?.find((s) => s.topicId === b.topicId);
                  const c = stackTop[i + 1]?.find((s) => s.topicId === b.topicId);
                  if (!(a && c)) return null;
                  return (
                    <path
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable period index
                      key={i}
                      d={curve(
                        xAt(i),
                        yScale(a.start),
                        yScale(a.end),
                        xAt(i + 1),
                        yScale(c.start),
                        yScale(c.end),
                      )}
                      fill={b.color}
                      opacity={op}
                    />
                  );
                })}
                {last && (span >= 0.025 || isHi) && (
                  <text
                    x={xAt(nP - 1) + 6}
                    y={yScale(mid) + 3.5}
                    fontFamily="var(--font-sans)"
                    fontSize={isHi ? 11 : 10}
                    fontWeight={isHi ? 600 : 500}
                    fill={isHi ? "var(--ink)" : "var(--ink-2)"}
                    opacity={highlightTopicId && !isHi ? 0.55 : 1}
                  >
                    {b.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ) : (
        <g>
          {bands.map((b) => {
            const isHi = highlightTopicId === b.topicId;
            const op = highlightTopicId ? (isHi ? 0.95 : 0.32) : baseAlpha;
            const tops = stackTop.map((row, i) => {
              const seg = row.find((s) => s.topicId === b.topicId) ?? { start: 0, end: 0 };
              const center = 0.5;
              const half = (seg.end - seg.start) / 2;
              const cumTo = seg.start + (seg.end - seg.start) / 2 - 0.5;
              return {
                x: xAt(i),
                top: pad.t + (center + cumTo - half) * innerH,
                bot: pad.t + (center + cumTo + half) * innerH,
              };
            });
            const d = `M ${tops.map((t) => `${t.x},${t.top}`).join(" L ")} L ${tops
              .slice()
              .reverse()
              .map((t) => `${t.x},${t.bot}`)
              .join(" L ")} Z`;
            return <path key={b.topicId} d={d} fill={b.color} opacity={op} />;
          })}
        </g>
      )}

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
          Lade Themenfluss …
        </text>
      )}
    </svg>
  );
}
