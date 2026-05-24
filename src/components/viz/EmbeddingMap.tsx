import { useMemo, useRef, useState } from "react";
import { PARTY, type PartyId } from "@/data/parties";
import { TOPICS, type TopicId } from "@/data/topics";

/** Real point from the atlas server function — see src/lib/server/atlas.ts */
export type AtlasRealPoint = {
  id: string;
  x: number;
  y: number;
  party: string;
  mpName: string | null;
  sessionDate: string;
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
   * Real atlas points from the server function. When non-null, replaces the
   * mock cloud + hides the mock topic labels (since their positions are fake).
   * Mock cloud + labels remain visible only while loading (realPoints === null).
   */
  realPoints?: AtlasRealPoint[] | null;
  /** Fired when a real point is clicked. */
  onPointClick?: (id: string) => void;
};

type Point = {
  x: number;
  y: number;
  tid: TopicId;
  fresh: boolean;
};

function germanShortDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hovered, setHovered] = useState<{ point: AtlasRealPoint; cx: number; cy: number } | null>(
    null,
  );

  // Mock points — only shown while real data hasn't arrived yet (skeleton state).
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

  const showRealData = realPoints !== null;

  // Legend: parties present in current real data, sorted by frequency descending.
  const legend = useMemo(() => {
    if (!realPoints || realPoints.length === 0) return [];
    const counts = new Map<string, number>();
    for (const p of realPoints) counts.set(p.party, (counts.get(p.party) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, count]) => ({ id: id as PartyId, count, def: PARTY[id as PartyId] }))
      .filter((e) => e.def)
      .sort((a, b) => b.count - a.count);
  }, [realPoints]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
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
        {/* Grid lines always visible — pure decoration */}
        {[-0.5, 0, 0.5].map((v) => (
          <g key={v}>
            <line x1={X(v)} y1={pad} x2={X(v)} y2={H - pad} stroke="var(--map-grid)" />
            <line x1={pad} y1={Y(v)} x2={W - pad} y2={Y(v)} stroke="var(--map-grid)" />
          </g>
        ))}

        {/* Mock background blobs + labels only while loading — they're at fake positions */}
        {!showRealData && (
          <>
            <defs>
              {TOPICS.map((t) => (
                <radialGradient key={t.id} id={`blob-${t.id}`} cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor={dark ? "rgba(184,90,82,0.22)" : "rgba(184,90,82,0.16)"}
                  />
                  <stop
                    offset="55%"
                    stopColor={dark ? "rgba(184,90,82,0.06)" : "rgba(184,90,82,0.05)"}
                  />
                  <stop offset="100%" stopColor="rgba(184,90,82,0)" />
                </radialGradient>
              ))}
            </defs>

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

            {points.map((p, i) => {
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
          </>
        )}

        {/* Real dots — only when data has loaded */}
        {showRealData &&
          realPoints.map((p) => {
            const partyDef = PARTY[p.party as PartyId];
            const fill = partyDef ? partyDef.colorVar : dotColor;
            const isHovered = hovered?.point.id === p.id;
            return (
              <circle
                key={p.id}
                cx={X(p.x)}
                cy={Y(p.y)}
                r={isHovered ? 4 : 2.4}
                fill={fill}
                opacity={isHovered ? 1 : 0.85}
                stroke={isHovered ? "var(--ink)" : "none"}
                strokeWidth={isHovered ? 1 : 0}
                onClick={onPointClick ? () => onPointClick(p.id) : undefined}
                onMouseEnter={() => setHovered({ point: p, cx: X(p.x), cy: Y(p.y) })}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: onPointClick ? "pointer" : "default" }}
              />
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

      {/* Legend overlay — only when real data loaded with at least one party */}
      {showRealData && legend.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "8px 10px",
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            boxShadow: "var(--shadow-sm)",
            fontFamily: "var(--font-sans)",
            fontSize: 10.5,
            zIndex: 1,
          }}
        >
          {legend.map((p) => (
            <div
              key={p.id}
              style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: p.def.colorVar,
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 600, color: p.def.colorVar }}>{p.def.name}</span>
              <span
                style={{
                  color: "var(--muted)",
                  marginLeft: "auto",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {p.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hover tooltip — single overlay positioned in SVG viewport coords via percentage */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: `${(hovered.cx / W) * 100}%`,
            top: `${(hovered.cy / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 14px))",
            pointerEvents: "none",
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            padding: "8px 12px",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--ink)",
            boxShadow: "var(--shadow-md, 0 6px 18px rgba(0,0,0,0.18))",
            whiteSpace: "nowrap",
            zIndex: 2,
            maxWidth: 260,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            {PARTY[hovered.point.party as PartyId] && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: PARTY[hovered.point.party as PartyId].colorVar,
                  display: "inline-block",
                }}
              />
            )}
            <span style={{ fontWeight: 600 }}>
              {hovered.point.mpName ?? "Unbekannte Sprecher:in"}
            </span>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            {germanShortDate(hovered.point.sessionDate)}
            {PARTY[hovered.point.party as PartyId] &&
              ` · ${PARTY[hovered.point.party as PartyId].name}`}
          </div>
        </div>
      )}
    </div>
  );
}
