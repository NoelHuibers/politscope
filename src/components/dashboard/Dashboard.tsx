import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";
import { PartyDot } from "@/components/PartyDot";
import { EmbeddingMap } from "@/components/viz/EmbeddingMap";
import { FingerprintGrid } from "@/components/viz/FingerprintGrid";
import { PositioningScatter } from "@/components/viz/PositioningScatter";
import { SankeyTimeline } from "@/components/viz/SankeyTimeline";
import { Scattertext } from "@/components/viz/Scattertext";
import { Sparkline } from "@/components/viz/Sparkline";
import { MPS } from "@/data/mps";
import { useUI } from "@/state/ui";
import { PanelHead } from "./PanelHead";

const HERO_SPEAKERS = [
  "merz",
  "habeck",
  "weidel",
  "wagenkn",
  "lindner",
  "scholz",
  "oezdemir",
  "trittin",
];

export function Dashboard() {
  const theme = useUI((s) => s.theme);
  const dark = theme === "dark";
  const params = useParams({ strict: false });
  const locale = (params.locale as string | undefined) ?? "de";

  const [hoveredId, setHoveredId] = useState<string | null>("oezdemir");
  const [hoveredW, setHoveredW] = useState<string | null>(null);
  const [sankeyMode, setSankeyMode] = useState<"sankey" | "stream">("sankey");

  const heroMps = MPS.filter((m) => HERO_SPEAKERS.includes(m.id));
  const hoveredMp = MPS.find((m) => m.id === hoveredId);

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
              hint="Jeder Punkt ist eine Rede. Cluster zeigen Themen. UMAP über 1 248 318 Reden."
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
                <div
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
                  }}
                >
                  <Icon name="search" size={12} color="var(--muted)" />
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      color: "var(--ink-2)",
                    }}
                  >
                    Reden zu „Migration" finden…
                  </span>
                </div>
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
                    <span>1 248 neue Reden seit Montag</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <EmbeddingMap width={680} height={520} dark={dark} newThisWeek />
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 22,
                  left: 22,
                  display: "flex",
                  gap: 4,
                  padding: "5px 6px",
                  background: "var(--panel)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 6,
                }}
              >
                {["Kontinent", "Region", "Stadt"].map((z, i) => (
                  <span
                    key={z}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: i === 0 ? "var(--ink)" : "transparent",
                      color: i === 0 ? "var(--bg)" : "var(--muted)",
                    }}
                  >
                    {z}
                  </span>
                ))}
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 22,
                  right: 22,
                  width: 280,
                  padding: "12px 14px",
                  background: "var(--panel)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 6,
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <PartyDot id="grn" size={9} />
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    Robert Habeck
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      color: "var(--muted)",
                    }}
                  >
                    Grüne
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    color: "var(--ink)",
                  }}
                >
                  „Die Energiewende ist kein Projekt der Eliten — sie ist die Bedingung dafür, dass
                  auch unsere Enkel hier noch leben können."
                </p>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    color: "var(--muted)",
                    letterSpacing: "0.04em",
                  }}
                >
                  13. NOV 2024 · 198. SITZUNG · CLUSTER „ENERGIEWENDE"
                </div>
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
                highlightTopicId="mig"
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
                  topic="Alle Themen"
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
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
                      <PartyDot id={hoveredMp.party} size={8} />
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{hoveredMp.name}</span>
                      <Sparkline
                        values={[0.78, 0.72, 0.65, 0.58, 0.52, 0.49, 0.47, 0.45]}
                        width={70}
                        height={18}
                      />
                      <span
                        style={{
                          marginLeft: "auto",
                          fontFamily: "var(--font-mono)",
                          fontSize: 9.5,
                          color: "var(--muted)",
                        }}
                      >
                        Kohäsion {hoveredMp.coh?.toFixed(2) ?? "—"} ▼
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
                />
              </div>
            </div>
          </div>

          {/* Fingerprint */}
          <div
            style={{
              gridColumn: 2,
              gridRow: 3,
              background: "var(--panel)",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <PanelHead
              eyebrow="Sprecher-Fingerprint"
              title="Rhetorische Profile auf einen Blick"
              hint="5 Merkmale × 16 Quartale (1990 → 2026) · 8 Top-Sprecher"
              right={
                <button type="button" className="btn-ghost">
                  <Icon name="plus" size={12} /> Sprecher
                </button>
              }
            />
            <div style={{ flex: 1, padding: "10px 14px 12px", overflow: "hidden" }}>
              <FingerprintGrid width={620} dark={dark} mps={heroMps} />
            </div>
          </div>
        </div>
      </div>
      <BottomStrip />
    </div>
  );
}
