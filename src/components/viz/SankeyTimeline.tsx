import { PERIODS } from "@/data/periods";
import { TOPIC_FLOWS, TOPICS, type TopicId } from "@/data/topics";

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  mode?: "sankey" | "stream";
  highlightTopicId?: TopicId | null;
};

const PALETTE: Record<TopicId, string> = {
  wirt: "var(--color-seq-2)",
  soz: "var(--color-seq-3)",
  auss: "var(--color-seq-5)",
  haus: "var(--color-seq-1)",
  umw: "#4a8a2c",
  mig: "var(--accent)",
  vert: "var(--color-seq-4)",
  eu: "var(--color-seq-5)",
  ges: "#b1d3c7",
  just: "var(--color-seq-3)",
  bil: "#d6cfb8",
  dig: "#b3d8e8",
  verk: "#cbd0a4",
  land: "#d8c98a",
};

export function SankeyTimeline({
  width = 660,
  height = 220,
  dark = false,
  mode = "sankey",
  highlightTopicId = null,
}: Props) {
  const pad = { l: 10, r: 56, t: 10, b: 22 };
  const W = width;
  const H = height;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const periods = PERIODS;
  const nP = periods.length;
  const xAt = (i: number) => pad.l + (i / (nP - 1)) * innerW;

  const topicIds = Object.keys(TOPIC_FLOWS) as TopicId[];
  const ordered = topicIds.slice().sort((a, b) => {
    const am = TOPIC_FLOWS[a].reduce((s, v) => s + v, 0);
    const bm = TOPIC_FLOWS[b].reduce((s, v) => s + v, 0);
    return bm - am;
  });

  const bands = ordered.map((tid) => ({ tid, series: TOPIC_FLOWS[tid] }));

  const stackTop: { tid: TopicId; start: number; end: number }[][] = [];
  for (let i = 0; i < nP; i++) {
    const total = bands.reduce((s, b) => s + (b.series[i] ?? 0), 0);
    let cum = 0;
    const row = bands.map((b) => {
      const start = cum;
      cum += b.series[i] ?? 0;
      return { tid: b.tid, start: start / total, end: cum / total };
    });
    stackTop.push(row);
  }

  const topicLabel = Object.fromEntries(TOPICS.map((t) => [t.id, t.label])) as Record<
    TopicId,
    string
  >;
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
            const isHi = highlightTopicId === b.tid;
            const op = highlightTopicId ? (isHi ? 0.95 : 0.32) : baseAlpha;
            const lastRow = stackTop[nP - 1];
            const last = lastRow?.find((s) => s.tid === b.tid);
            const mid = last ? (last.start + last.end) / 2 : 0;
            const span = last ? last.end - last.start : 0;
            return (
              <g key={b.tid}>
                {Array.from({ length: nP - 1 }).map((_, i) => {
                  const a = stackTop[i]?.find((s) => s.tid === b.tid);
                  const c = stackTop[i + 1]?.find((s) => s.tid === b.tid);
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
                      fill={PALETTE[b.tid]}
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
                    {topicLabel[b.tid]}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ) : (
        <g>
          {bands.map((b) => {
            const isHi = highlightTopicId === b.tid;
            const op = highlightTopicId ? (isHi ? 0.95 : 0.32) : baseAlpha;
            const tops = stackTop.map((row, i) => {
              const seg = row.find((s) => s.tid === b.tid) ?? { start: 0, end: 0 };
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
            return <path key={b.tid} d={d} fill={PALETTE[b.tid]} opacity={op} />;
          })}
        </g>
      )}
    </svg>
  );
}
