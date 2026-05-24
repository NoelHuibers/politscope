import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { MaverickCard } from "@/components/dashboard/MaverickCard";
import { Icon } from "@/components/Icon";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";
import { PartyDot } from "@/components/PartyDot";
import { EmbeddingMap } from "@/components/viz/EmbeddingMap";
import { PositioningScatter } from "@/components/viz/PositioningScatter";
import { SankeyTimeline } from "@/components/viz/SankeyTimeline";
import { Scattertext } from "@/components/viz/Scattertext";
import { PARTIES, type PartyId } from "@/data/parties";
import { formatGerman, useCorpusStats } from "@/lib/hooks/useCorpusStats";
import { getAtlasPoints } from "@/lib/server/atlas";
import { getPositioning } from "@/lib/server/positioning";
import { getScattertext } from "@/lib/server/scattertext";
import { getTopicFlows } from "@/lib/server/topic-flows";
import { useFilters } from "@/state/filters";
import { useUI } from "@/state/ui";
import { PanelHead } from "./PanelHead";

const ALL_PARTY_IDS = PARTIES.map((p) => p.id);

export function Dashboard() {
  const theme = useUI((s) => s.theme);
  const dark = theme === "dark";
  const params = useParams({ strict: false });
  const locale = (params.locale as string | undefined) ?? "de";

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [filters, setFilters] = useFilters();
  // Filter semantics:
  // - parties === ALL → send undefined (= no filter, skip WHERE)
  // - parties === [] → send [] (= match nothing, expected to return zero rows)
  // - parties === [subset] → send that subset
  const partyFilter =
    filters.parties.length === ALL_PARTY_IDS.length ? undefined : [...filters.parties].sort();
  const wpFilter = filters.period;
  const topicFilter = filters.topic;

  const atlasQuery = useQuery({
    queryKey: ["atlas-points", partyFilter ?? "ALL", wpFilter, topicFilter],
    queryFn: () =>
      getAtlasPoints({
        data: {
          parties: partyFilter,
          wahlperiode: wpFilter ?? undefined,
          topic: topicFilter ?? undefined,
        },
      }),
  });

  const positioningQuery = useQuery({
    queryKey: ["positioning", topicFilter, "afd", "grn"],
    queryFn: () =>
      getPositioning({ data: { topic: topicFilter ?? null, axisA: "afd", axisB: "grn" } }),
  });

  const scattertextQuery = useQuery({
    queryKey: ["scattertext", topicFilter, "afd", "grn"],
    queryFn: () =>
      getScattertext({ data: { topic: topicFilter ?? null, partyA: "afd", partyB: "grn" } }),
  });

  const topicFlowsQuery = useQuery({
    queryKey: ["topic-flows"],
    queryFn: () => getTopicFlows(),
  });

  /** Click a party in the legend → toggle it in the LeftRail party filter. */
  const togglePartyFilter = (partyId: string) => {
    const active = new Set(filters.parties);
    if (active.has(partyId)) active.delete(partyId);
    else active.add(partyId);
    setFilters({ parties: Array.from(active) });
  };

  /** Click a cluster label → set the topic filter (or clear if same cluster clicked twice). */
  const toggleTopicFilter = (topicId: string) => {
    setFilters({ topic: filters.topic === topicId ? null : topicId });
  };
  const statsQuery = useCorpusStats();
  const openSpeechInspector = useUI((s) => s.openSpeechInspector);
  const openSearchPalette = useUI((s) => s.openSearchPalette);
  const totalSpeechesLabel = formatGerman(statsQuery.data?.totalSpeeches);
  const newThisWeekLabel = formatGerman(statsQuery.data?.newThisWeek);
  const [hoveredW, setHoveredW] = useState<string | null>(null);
  const [sankeyMode, setSankeyMode] = useState<"sankey" | "stream">("sankey");

  const hoveredMp = hoveredId
    ? (positioningQuery.data?.mps.find((m) => m.extId === hoveredId) ?? null)
    : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
      }}
    >
      <TopBar />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <LeftRail />
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gridTemplateRows: "minmax(190px, auto) minmax(220px, 1fr) minmax(190px, auto)",
            gap: 1,
            background: "var(--hairline)",
            padding: 1,
            minWidth: 0,
          }}
        >
          {/* Atlas — full-height left */}
          <div
            style={{
              gridRow: "1 / span 3",
              background: "var(--panel)",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <PanelHead
              eyebrow="Karte · Embedding-Atlas"
              title="Reden, projiziert in den semantischen Raum"
              hint={`Jeder Punkt ist eine Rede. Cluster zeigen Themen. UMAP über ${totalSpeechesLabel} Reden.`}
              ki
              right={
                <>
                  <button type="button" className="btn-ghost">
                    <Icon name="reset" size={12} /> Ansicht zurücksetzen
                  </button>
                  <button type="button" className="btn-ghost" aria-label="Fullscreen">
                    <Icon name="expand" size={12} />
                  </button>
                </>
              }
            />
            <div
              style={{
                flex: 1,
                padding: 14,
                position: "relative",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  left: 22,
                  right: 22,
                  display: "flex",
                  justifyContent: "space-between",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => openSearchPalette()}
                  style={{
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 12px",
                    borderRadius: 6,
                    background: "var(--panel)",
                    border: "1px solid var(--hairline)",
                    boxShadow: "var(--shadow-sm)",
                    cursor: "pointer",
                    color: "var(--ink-2)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                  }}
                >
                  <Icon name="search" size={12} color="var(--muted)" />
                  Reden durchsuchen…
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--muted)",
                      marginLeft: 6,
                      padding: "1px 5px",
                      border: "1px solid var(--hairline)",
                      borderRadius: 3,
                    }}
                  >
                    ⌘K
                  </span>
                </button>
                {(statsQuery.data?.newThisWeek ?? 0) > 0 && (
                  <div
                    style={{
                      pointerEvents: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      alignItems: "flex-end",
                    }}
                  >
                    <div className="chip" style={{ background: "var(--panel)" }}>
                      <span className="dot" style={{ background: "var(--accent)" }} />
                      <span>{newThisWeekLabel} neue Reden diese Woche</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <EmbeddingMap
                  width={680}
                  height={520}
                  dark={dark}
                  newThisWeek={(statsQuery.data?.newThisWeek ?? 0) > 0}
                  newThisWeekCount={statsQuery.data?.newThisWeek ?? 0}
                  realPoints={atlasQuery.data?.points ?? null}
                  realClusters={atlasQuery.data?.clusters ?? null}
                  activeTopicId={topicFilter}
                  activePartyIds={partyFilter}
                  onPointClick={openSpeechInspector}
                  onClusterClick={toggleTopicFilter}
                  onLegendPartyClick={togglePartyFilter}
                />
                {atlasQuery.data && atlasQuery.data.projected === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--panel)",
                        border: "1px solid var(--hairline)",
                        borderRadius: 8,
                        padding: "16px 24px",
                        fontFamily: "var(--font-sans)",
                        fontSize: 13,
                        color: "var(--ink-2)",
                        textAlign: "center",
                        boxShadow: "var(--shadow-sm)",
                        pointerEvents: "auto",
                      }}
                    >
                      Keine Reden für diese Auswahl.
                      <br />
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>
                        Filter anpassen oder zurücksetzen.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sankey */}
          <div
            style={{
              gridColumn: 2,
              gridRow: 1,
              background: "var(--panel)",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <PanelHead
              eyebrow="Themenfluss · 1990 → heute"
              title="Wie Themen über Wahlperioden wachsen, schrumpfen, sich verschieben"
              hint="Aktuell hervorgehoben: Migration"
              right={
                <div
                  style={{
                    display: "flex",
                    border: "1px solid var(--hairline)",
                    borderRadius: 6,
                    overflow: "hidden",
                    height: 26,
                  }}
                >
                  {(["sankey", "stream"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSankeyMode(k)}
                      style={{
                        padding: "0 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        background: sankeyMode === k ? "var(--ink)" : "transparent",
                        color: sankeyMode === k ? "var(--bg)" : "var(--muted)",
                        border: "none",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              }
            />
            <div
              style={{ flex: 1, padding: "8px 14px 12px", display: "flex", alignItems: "stretch" }}
            >
              <SankeyTimeline
                width={640}
                height={210}
                dark={dark}
                mode={sankeyMode}
                highlightTopicId={topicFilter}
                realFlows={topicFlowsQuery.data ?? null}
              />
            </div>
          </div>

          {/* Positioning + Scattertext */}
          <div
            style={{
              gridColumn: 2,
              gridRow: 2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              backgroundColor: "var(--hairline)",
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: "var(--panel)",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <PanelHead
                eyebrow="Sprecherpositionierung"
                title="Wer klingt wie eine andere Fraktion?"
                hint="Achse: AfD ↔ Grüne · Thema: Alle"
                right={
                  <Link
                    to="/$locale/positionierung"
                    params={{ locale }}
                    className="btn-ghost"
                    style={{ textDecoration: "none" }}
                  >
                    <Icon name="expand" size={12} /> Detail
                  </Link>
                }
              />
              <div
                style={{
                  flex: 1,
                  padding: "6px 8px 4px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "stretch",
                }}
              >
                <PositioningScatter
                  width={320}
                  height={210}
                  dark={dark}
                  axisA="afd"
                  axisB="grn"
                  topic={topicFilter ? "ausgewähltes Thema" : "Alle Themen"}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  realMps={positioningQuery.data?.mps ?? null}
                />
                <div
                  style={{
                    padding: "6px 8px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    color: "var(--ink-2)",
                    borderTop: "1px solid var(--hairline-2)",
                    marginTop: 6,
                  }}
                >
                  {hoveredMp ? (
                    <>
                      <PartyDot id={hoveredMp.party as PartyId} size={8} />
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{hoveredMp.name}</span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontFamily: "var(--font-mono)",
                          fontSize: 9.5,
                          color: "var(--muted)",
                        }}
                      >
                        ax={hoveredMp.ax.toFixed(2)} · {hoveredMp.n} Reden
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>Punkt fokussieren …</span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "var(--panel)",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <PanelHead
                eyebrow="Wortvergleich · Scattertext"
                title="Was unterscheidet AfD vs. Grüne?"
                hint="Klick auf ein Wort → Beispielsätze"
              />
              <div style={{ flex: 1, padding: "6px 8px 8px" }}>
                <Scattertext
                  width={320}
                  height={230}
                  dark={dark}
                  partyA="afd"
                  partyB="grn"
                  hoveredW={hoveredW}
                  onHover={setHoveredW}
                  realWords={scattertextQuery.data?.words ?? null}
                />
              </div>
            </div>
          </div>

          {/* Profil der Woche */}
          <div
            style={{
              gridColumn: 2,
              gridRow: 3,
              background: "var(--panel)",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <MaverickCard />
          </div>
        </div>
      </div>
      <BottomStrip />
    </div>
  );
}
