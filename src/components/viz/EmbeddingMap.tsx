import { useMemo } from "react";
import { PARTY, type PartyId } from "@/data/parties";
import { TOPICS, type TopicId } from "@/data/topics";

/** Real point from the atlas server function — see src/lib/server/atlas.ts */
export type AtlasRealPoint = {
  id: string;
  x: number;
  y: number;
  party: string;
};

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  highlightTopic?: TopicId | null;
  /** If true, draws the "Neu in dieser Woche · N" badge. */
  newThisWeek?: boolean;
  /** Count to show in the new-this-week badge. Defaults to 0 → no badge. */
  newThisWeekCount?: number;
  /**
   * Real atlas points from the server function. If provided (length > 0),
   * replaces the synthetic mock points. Mock cluster labels still render
   * because we don't have topic clustering yet (#17).
   */
  realPoints?: AtlasRealPoint[] | null;
  /** Fired when a real point is clicked. Mock points are not clickable. */
  onPointClick?: (id: string) => void;
};

type Point = {
  x: number;
  y: number;
  tid: TopicId;
  fresh: boolean;
};

/**
 * SVG-based density-cloud + foreground points + cluster labels.
 * Visually faithful to the mockup; deck.gl/WebGL upgrade lands when we have
 * the real 1.25M-point dataset.
 */
export function EmbeddingMap({
  width = 700,
  height = 540,
  dark = false,
  highlightTopic = null,
  newThisWeek = false,
  newThisWeekCount = 0,
  realPoints = null,
  onPointClick,
}: Props) {
  const formattedNew = newThisWeekCount.toLocaleString("de-DE").replace(/\./g, " ");
  const points = useMemo<Point[]>(() => {
    const out: Point[] = [];
    let seed = 1;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (const t of TOPICS) {
      const n = Math.round(t.n / 700);
      for (let i = 0; i < n; i++) {
        const r = (rand() + rand() + rand()) / 3 - 0.5;
        const r2 = (rand() + rand() + rand()) / 3 - 0.5;
        out.push({
          x: t.x + r * 0.42,
          y: t.y + r2 * 0.36,
          tid: t.id,
          fresh: rand() < 0.012,
        });
      }
    }
    return out;
  }, []);

  const pad = 24;
  const W = width;
  const H = height;
  const X = (x: number) => pad + ((x + 1) / 2) * (W - 2 * pad);
  const Y = (y: number) => pad + ((y + 1) / 2) * (H - 2 * pad);

  const dotColor = dark ? "rgba(220,210,190,0.34)" : "rgba(40,30,20,0.32)";
  const dotColorDim = dark ? "rgba(220,210,190,0.10)" : "rgba(40,30,20,0.08)";
  const labelColor = dark ? "rgba(232,230,224,0.95)" : "rgba(20,18,12,0.85)";
  const labelMuted = dark ? "rgba(232,230,224,0.55)" : "rgba(20,18,12,0.50)";

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        display: "block",
        background: "var(--map-bg)",
        borderRadius: 4,
        width: "100%",
        height: "100%",
      }}
      role="img"
      aria-label="Embedding-Atlas der Bundestagsreden"
    >
      <defs>
        {TOPICS.map((t) => (
          <radialGradient key={t.id} id={`blob-${t.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={dark ? "rgba(184,90,82,0.22)" : "rgba(184,90,82,0.16)"} />
            <stop offset="55%" stopColor={dark ? "rgba(184,90,82,0.06)" : "rgba(184,90,82,0.05)"} />
            <stop offset="100%" stopColor="rgba(184,90,82,0)" />
          </radialGradient>
        ))}
      </defs>

      {[-0.5, 0, 0.5].map((v) => (
        <g key={v}>
          <line x1={X(v)} y1={pad} x2={X(v)} y2={H - pad} stroke="var(--map-grid)" />
          <line x1={pad} y1={Y(v)} x2={W - pad} y2={Y(v)} stroke="var(--map-grid)" />
        </g>
      ))}

      {TOPICS.map((t) => {
        const rx = 60 + Math.sqrt(t.n) / 8;
        const ry = rx * 0.85;
        const dim = highlightTopic && highlightTopic !== t.id ? 0.35 : 1;
        return (
          <ellipse
            key={t.id}
            cx={X(t.x)}
            cy={Y(t.y)}
            rx={rx}
            ry={ry}
            fill={`url(#blob-${t.id})`}
            opacity={dim}
          />
        );
      })}

      {realPoints && realPoints.length > 0
        ? realPoints.map((p) => {
            const partyDef = PARTY[p.party as PartyId];
            const fill = partyDef ? partyDef.colorVar : dotColor;
            return (
              <circle
                key={p.id}
                cx={X(p.x)}
                cy={Y(p.y)}
                r={2.4}
                fill={fill}
                opacity={0.85}
                onClick={onPointClick ? () => onPointClick(p.id) : undefined}
                style={onPointClick ? { cursor: "pointer" } : undefined}
              >
                {onPointClick && <title>Klick: Rede ansehen</title>}
              </circle>
            );
          })
        : points.map((p, i) => {
            const dim = highlightTopic && highlightTopic !== p.tid;
            const isFresh = p.fresh && newThisWeek;
            return (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: stable seeded order, no insertions
                key={i}
                cx={X(p.x)}
                cy={Y(p.y)}
                r={isFresh ? 2.2 : 1.2}
                fill={isFresh ? "var(--accent)" : dim ? dotColorDim : dotColor}
                opacity={isFresh ? 1 : dim ? 1 : 0.92}
              />
            );
          })}

      {TOPICS.map((t) => {
        const big = (["wirt", "soz", "umw", "auss", "haus"] as const).includes(t.id as never);
        const dimmed = highlightTopic && highlightTopic !== t.id;
        return (
          <g key={t.id}>
            <text
              x={X(t.x)}
              y={Y(t.y)}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={big ? 13 : 11.5}
              fontWeight={big ? 600 : 500}
              fill={dimmed ? labelMuted : labelColor}
              style={{ pointerEvents: "none" }}
            >
              {t.label}
            </text>
            {big && (
              <text
                x={X(t.x)}
                y={Y(t.y) + 14}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9.5}
                fill={labelMuted}
                style={{ pointerEvents: "none" }}
              >
                {(t.n / 1000).toFixed(0)}k
              </text>
            )}
          </g>
        );
      })}

      {newThisWeek && (
        <g transform={`translate(${W - pad - 142}, ${pad + 4})`}>
          <rect
            x={0}
            y={0}
            width={138}
            height={22}
            rx={11}
            fill={dark ? "rgba(217,122,110,0.14)" : "rgba(184,90,82,0.10)"}
            stroke="var(--accent)"
            strokeOpacity="0.4"
          />
          <circle cx={11} cy={11} r={3.2} fill="var(--accent)" />
          <text
            x={22}
            y={15}
            fontFamily="var(--font-sans)"
            fontSize={10.5}
            fontWeight={500}
            fill="var(--accent)"
          >
            Neu in dieser Woche · {formattedNew}
          </text>
        </g>
      )}
    </svg>
  );
}
