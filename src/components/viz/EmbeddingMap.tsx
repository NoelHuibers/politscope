import { OrthographicView, type PickingInfo } from "@deck.gl/core";
import { ScatterplotLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { useEffect, useMemo, useState } from "react";
import { PARTY, type PartyId, partyRgb } from "@/data/parties";
import { TOPICS } from "@/data/topics";

export type AtlasRealPoint = {
  id: string;
  x: number;
  y: number;
  party: string;
  mpName: string | null;
  sessionDate: string;
};

export type AtlasRealCluster = {
  topicId: string;
  cx: number;
  cy: number;
  size: number;
  keywords: string[];
};

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  newThisWeek?: boolean;
  newThisWeekCount?: number;
  realPoints?: AtlasRealPoint[] | null;
  realClusters?: AtlasRealCluster[] | null;
  activeTopicId?: string | null;
  activePartyIds?: string[];
  onPointClick?: (id: string) => void;
  onClusterClick?: (topicId: string) => void;
  onLegendPartyClick?: (partyId: string) => void;
};

type ViewState = {
  target: [number, number, number];
  zoom: number;
};

const INITIAL_VIEW_STATE: ViewState = {
  target: [0, 0, 0],
  zoom: 7.8,
};

const VIEW = new OrthographicView({ id: "ortho", flipY: true });

function germanShortDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function EmbeddingMap({
  dark = false,
  newThisWeek = false,
  newThisWeekCount = 0,
  realPoints = null,
  realClusters = null,
  activeTopicId = null,
  activePartyIds,
  onPointClick,
  onClusterClick,
  onLegendPartyClick,
}: Props) {
  const formattedNew = newThisWeekCount.toLocaleString("de-DE").replace(/\./g, " ");
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<{
    point: AtlasRealPoint;
    px: number;
    py: number;
  } | null>(null);

  // DeckGL must not render during SSR (WebGL is browser-only).
  useEffect(() => setMounted(true), []);

  const showRealData = realPoints !== null;

  // Mock points generated once for the loading skeleton.
  const mockPoints = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    let seed = 1;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (const t of TOPICS) {
      const n = Math.round(t.n / 700);
      for (let i = 0; i < n; i += 1) {
        const r = (rand() + rand() + rand()) / 3 - 0.5;
        const r2 = (rand() + rand() + rand()) / 3 - 0.5;
        out.push({ x: t.x + r * 0.42, y: t.y + r2 * 0.36 });
      }
    }
    return out;
  }, []);

  const legend = useMemo(() => {
    if (!realPoints || realPoints.length === 0) return [];
    const counts = new Map<string, number>();
    for (const p of realPoints) counts.set(p.party, (counts.get(p.party) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, count]) => ({ id: id as PartyId, count, def: PARTY[id as PartyId] }))
      .filter((e) => e.def)
      .sort((a, b) => b.count - a.count);
  }, [realPoints]);

  const dotColor: [number, number, number] = dark ? [220, 210, 190] : [40, 30, 20];

  const layers = useMemo(() => {
    if (showRealData && realPoints) {
      return [
        new ScatterplotLayer<AtlasRealPoint>({
          id: "real-points",
          data: realPoints,
          getPosition: (p) => [p.x, p.y],
          getFillColor: (p) => {
            const [r, g, b] = partyRgb(p.party as PartyId, dark);
            return [r, g, b, 220];
          },
          getRadius: 6,
          radiusUnits: "pixels",
          radiusMinPixels: 2.5,
          radiusMaxPixels: 14,
          pickable: onPointClick !== undefined,
          onClick: onPointClick
            ? (info: PickingInfo<AtlasRealPoint>) => {
                if (info.object) onPointClick(info.object.id);
              }
            : undefined,
          onHover: (info: PickingInfo<AtlasRealPoint>) => {
            if (info.object && info.x !== undefined && info.y !== undefined) {
              setHovered({ point: info.object, px: info.x, py: info.y });
            } else {
              setHovered(null);
            }
          },
          autoHighlight: true,
          highlightColor: [255, 255, 255, 80],
        }),
      ];
    }
    return [
      new ScatterplotLayer({
        id: "mock-points",
        data: mockPoints,
        getPosition: (p: { x: number; y: number }) => [p.x, p.y],
        getFillColor: () => [dotColor[0], dotColor[1], dotColor[2], 90],
        getRadius: 3,
        radiusUnits: "pixels",
        pickable: false,
      }),
    ];
  }, [showRealData, realPoints, mockPoints, dark, onPointClick, dotColor]);

  // Pre-compute zoom scale + target so the cluster-label sub-components depend
  // on primitive numbers (no fresh-closure infinite-render-loop trap).
  const zoomScale = 2 ** viewState.zoom;
  const targetX = viewState.target[0];
  const targetY = viewState.target[1];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "var(--map-bg)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {mounted && (
        <DeckGL
          views={VIEW}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={({ viewState: v }) => setViewState(v as ViewState)}
          controller={true}
          layers={layers}
          style={{ position: "absolute", inset: "0" }}
        />
      )}

      {/* Cluster labels — positioned in screen coords via viewState projection.
          Re-render on every viewState change (handled by React). */}
      {showRealData &&
        realClusters?.map((c) => {
          if (c.keywords.length === 0) return null;
          const label = c.keywords.slice(0, 2).join(" · ");
          const fontSize = 11 + Math.min(4, c.size / 10);
          const isActive = activeTopicId === c.topicId;
          const clickable = onClusterClick !== undefined;
          return (
            <ClusterLabel
              key={c.topicId}
              cx={c.cx}
              cy={c.cy}
              size={c.size}
              label={label}
              fontSize={fontSize}
              isActive={isActive}
              clickable={clickable}
              dark={dark}
              zoomScale={zoomScale}
              targetX={targetX}
              targetY={targetY}
              onClick={clickable ? () => onClusterClick?.(c.topicId) : undefined}
            />
          );
        })}

      {/* "Neu in dieser Woche" badge — fixed position top-right */}
      {newThisWeek && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: "5px 10px",
            background: dark ? "rgba(217,122,110,0.14)" : "rgba(184,90,82,0.10)",
            border: "1px solid var(--accent)",
            borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
            borderRadius: 11,
            fontFamily: "var(--font-sans)",
            fontSize: 10.5,
            fontWeight: 500,
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
          Neu in dieser Woche · {formattedNew}
        </div>
      )}

      {/* Legend overlay — top-left */}
      {showRealData && legend.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: "6px",
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            boxShadow: "var(--shadow-sm)",
            fontFamily: "var(--font-sans)",
            fontSize: 10.5,
            zIndex: 1,
            minWidth: 150,
          }}
        >
          {legend.map((p) => {
            const isActive = activePartyIds === undefined || activePartyIds.includes(p.id);
            const clickable = onLegendPartyClick !== undefined;
            return (
              <button
                key={p.id}
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onLegendPartyClick?.(p.id) : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px",
                  borderRadius: 3,
                  background: "transparent",
                  border: "none",
                  cursor: clickable ? "pointer" : "default",
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 10.5,
                  opacity: isActive ? 1 : 0.4,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: p.def.colorVar,
                    display: "inline-block",
                    flexShrink: 0,
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
              </button>
            );
          })}
        </div>
      )}

      {/* Hover tooltip — pixel coords from deck.gl */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: hovered.px,
            top: hovered.py,
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

      {/* Pan/zoom hint — bottom-right, subtle */}
      {showRealData && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--muted)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          Ziehen zum Verschieben · Scroll zum Zoomen
        </div>
      )}
    </div>
  );
}

// ---- internal sub-component for cluster labels ----

type ClusterLabelProps = {
  cx: number;
  cy: number;
  size: number;
  label: string;
  fontSize: number;
  isActive: boolean;
  clickable: boolean;
  dark: boolean;
  /** 2^viewState.zoom — world units → screen pixels multiplier. */
  zoomScale: number;
  /** viewState.target[0] / [1] — pan offset in world coords. */
  targetX: number;
  targetY: number;
  onClick?: () => void;
};

function ClusterLabel({
  cx,
  cy,
  fontSize,
  size,
  label,
  isActive,
  clickable,
  dark,
  zoomScale,
  targetX,
  targetY,
  onClick,
}: ClusterLabelProps) {
  const [containerRef, setContainerRef] = useState<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!containerRef) return;
    const parent = containerRef.parentElement;
    if (!parent) return;
    const update = () => {
      const rect = parent.getBoundingClientRect();
      const dx = (cx - targetX) * zoomScale;
      const dy = (cy - targetY) * zoomScale;
      setPos([rect.width / 2 + dx, rect.height / 2 + dy]);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [containerRef, cx, cy, zoomScale, targetX, targetY]);

  // Recompute on every parent render via the project closure
  // (it captures viewState — when viewState changes, project changes, useEffect fires).
  // When pos is null (still measuring), render an invisible placeholder button that
  // sets the ref so the effect can run.
  if (!pos) {
    return (
      <button
        ref={setContainerRef}
        type="button"
        tabIndex={-1}
        style={{ position: "absolute", display: "none" }}
      />
    );
  }

  const labelColor = isActive
    ? "var(--accent)"
    : dark
      ? "rgba(232,230,224,0.95)"
      : "rgba(20,18,12,0.85)";
  const subColor = isActive
    ? "var(--accent)"
    : dark
      ? "rgba(232,230,224,0.55)"
      : "rgba(20,18,12,0.50)";

  return (
    <button
      ref={setContainerRef}
      type="button"
      disabled={!clickable}
      onClick={clickable ? onClick : undefined}
      style={{
        position: "absolute",
        left: pos[0],
        top: pos[1],
        transform: "translate(-50%, -50%)",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: clickable ? "pointer" : "default",
        pointerEvents: clickable ? "auto" : "none",
        textAlign: "center",
        zIndex: 1,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize,
          fontWeight: isActive ? 700 : 600,
          color: labelColor,
          textShadow:
            "0 0 4px var(--map-bg), 0 0 4px var(--map-bg), 0 0 6px var(--map-bg), 0 0 6px var(--map-bg)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: subColor,
          textShadow: "0 0 4px var(--map-bg), 0 0 4px var(--map-bg)",
          whiteSpace: "nowrap",
        }}
      >
        {size} Reden
      </div>
    </button>
  );
}
