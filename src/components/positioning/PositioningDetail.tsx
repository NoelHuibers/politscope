import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { MaverickCard } from "@/components/dashboard/MaverickCard";
import { GlossaryNote } from "@/components/GlossaryNote";
import { Icon } from "@/components/Icon";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";
import { PartyDot } from "@/components/PartyDot";
import { PositioningScatter } from "@/components/viz/PositioningScatter";
import { PARTY, type PartyId } from "@/data/parties";
import { useCorpusStats } from "@/lib/hooks/useCorpusStats";
import { getPositioning, type PositioningMp } from "@/lib/server/positioning";
import { useFilters } from "@/state/filters";
import { useUI } from "@/state/ui";

const TOP_N_OUTLIERS = 8;

/** Top N MPs sorted by |ax| (how far they sit from the midpoint of the axis). */
function pickOutliers(mps: PositioningMp[]): PositioningMp[] {
  return [...mps]
    .filter((m) => m.n >= 2)
    .sort((a, b) => Math.abs(b.ax) - Math.abs(a.ax))
    .slice(0, TOP_N_OUTLIERS);
}

function driftLabel(ax: number, axisA: PartyId, axisB: PartyId): string {
  // ax: +1 = axisA pole, -1 = axisB pole.
  const pct = Math.round(Math.abs(ax) * 100);
  const pole = ax >= 0 ? axisA : axisB;
  return `klingt ${pct} % näher an ${PARTY[pole]?.name ?? pole}`;
}

export function PositioningDetail() {
  const theme = useUI((s) => s.theme);
  const dark = theme === "dark";
  const [filters] = useFilters();
  const topicFilter = filters.topic;

  // For now, axis poles are fixed (matches dashboard default). Wiring axis
  // selectors is a follow-up — getPositioning already takes axisA / axisB.
  const axisA: PartyId = "afd";
  const axisB: PartyId = "grn";

  const positioningQuery = useQuery({
    queryKey: ["positioning", topicFilter, axisA, axisB],
    queryFn: () => getPositioning({ data: { topic: topicFilter ?? null, axisA, axisB } }),
  });

  const stats = useCorpusStats();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const mps = positioningQuery.data?.mps ?? [];
  const outliers = pickOutliers(mps);
  const totalMps = stats.data?.totalMps ?? null;
  const earliestYear = stats.data?.earliestDate?.slice(0, 4);
  const latestYear = stats.data?.latestDate?.slice(0, 4);
  const topicLabel = topicFilter ? "ausgewähltes Thema" : "Alle Themen";

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      <TopBar />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <LeftRail />
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 1,
            background: "var(--hairline)",
            padding: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* Left: scatter + axis controls */}
          <div
            style={{
              background: "var(--panel)",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              padding: "20px 24px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <span className="t-eyebrow">
                Sprecherpositionierung
                {totalMps !== null && ` · ${totalMps} MdB`}
                {earliestYear && latestYear && ` · ${earliestYear}–${latestYear}`}
              </span>
            </div>
            <h1 className="t-display" style={{ margin: "2px 0 6px" }}>
              Wer klingt wie eine andere Fraktion?
            </h1>
            <p
              style={{
                margin: "0 0 14px",
                maxWidth: 560,
                fontFamily: "var(--font-sans)",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "var(--ink-2)",
              }}
            >
              Jeder Punkt ist ein Bundestagsabgeordneter, eingefärbt nach tatsächlicher Fraktion.
              Die Position auf der waagerechten Achse zeigt, wessen Sprache — {PARTY[axisA].name}{" "}
              oder {PARTY[axisB].name} — die Reden dieses MdB rhetorisch näherkommen.
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <span className="t-eyebrow" style={{ color: "var(--ink-2)" }}>
                Achse
              </span>
              <div className="chip" style={{ height: 28, padding: "0 12px" }}>
                <PartyDot id={axisA} size={9} /> {PARTY[axisA].name}
              </div>
              <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                ↔
              </span>
              <div className="chip" style={{ height: 28, padding: "0 12px" }}>
                <PartyDot id={axisB} size={9} /> {PARTY[axisB].name}
              </div>
              <span
                style={{ width: 1, height: 22, background: "var(--hairline)", margin: "0 4px" }}
              />
              <span className="t-eyebrow" style={{ color: "var(--ink-2)" }}>
                Thema
              </span>
              <div className="chip" style={{ height: 28, padding: "0 12px" }}>
                {topicLabel}
              </div>
              <div style={{ flex: 1 }} />
              <button type="button" className="btn-ghost">
                <Icon name="info" size={12} /> Methodik
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
              <PositioningScatter
                width={620}
                height={420}
                dark={dark}
                axisA={axisA}
                axisB={axisB}
                topic={topicLabel}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                realMps={positioningQuery.data?.mps ?? null}
              />
            </div>

            <GlossaryNote />
          </div>

          {/* Right: outlier list + Maverick card */}
          <div
            style={{
              background: "var(--panel)",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              padding: "20px 24px 16px",
              gap: 16,
              overflow: "hidden",
            }}
          >
            <MaverickCard />

            <div
              style={{
                background: "var(--panel-2)",
                border: "1px solid var(--hairline)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--hairline-2)",
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span className="t-eyebrow">Auffällige Abweichungen</span>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 14.5,
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginTop: 3,
                    }}
                  >
                    Top-Abweichler · {topicLabel}
                  </div>
                </div>
                <span className="ki-tag">KI-Score</span>
              </div>

              {positioningQuery.isPending && (
                <div
                  style={{
                    padding: "14px",
                    color: "var(--muted)",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Berechne Positionierung …
                </div>
              )}

              {positioningQuery.data && outliers.length === 0 && (
                <div
                  style={{
                    padding: "14px",
                    color: "var(--muted)",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Zu wenige Reden für statistische Auswertung.
                </div>
              )}

              {outliers.map((m) => (
                <Link
                  key={m.extId}
                  to="/$locale/abgeordnete/$id"
                  params={{ locale: "de", id: m.extId }}
                  onMouseEnter={() => setHoveredId(m.extId)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: "11px 14px",
                    borderTop: "1px solid var(--hairline-2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                    color: "inherit",
                    background: hoveredId === m.extId ? "var(--bg-2)" : "transparent",
                    transition: "background 80ms ease-out",
                  }}
                >
                  <PartyDot id={m.party as PartyId} size={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 11.5,
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {PARTY[m.party as PartyId]?.name ?? m.party} ·{" "}
                      {driftLabel(m.ax, axisA, axisB)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--ink-2)",
                      }}
                    >
                      ax {m.ax >= 0 ? "+" : ""}
                      {m.ax.toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        color: "var(--muted)",
                      }}
                    >
                      {m.n} Reden
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomStrip />
    </div>
  );
}
