"use client";

import { useState } from "react";
import { MaverickCard } from "@/components/dashboard/MaverickCard";
import { GlossaryNote } from "@/components/GlossaryNote";
import { Icon } from "@/components/Icon";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";
import { PartyDot } from "@/components/PartyDot";
import { PositioningScatter } from "@/components/viz/PositioningScatter";
import { Sparkline } from "@/components/viz/Sparkline";
import { MPS } from "@/data/mps";
import { PARTY } from "@/data/parties";
import { useUI } from "@/state/ui";

const TOP_OUTLIERS = [
  { id: "oezdemir", drift: "klingt 38 % näher an FDP", n: 14 },
  { id: "kuban", drift: "klingt 31 % näher an AfD", n: 22 },
  { id: "wagenkn", drift: "klingt 27 % näher an CDU", n: 19 },
  { id: "scholz", drift: "klingt 18 % näher an CDU", n: 41 },
] as const;

export function PositioningDetail() {
  const theme = useUI((s) => s.theme);
  const dark = theme === "dark";
  const [hoveredId, setHoveredId] = useState<string | null>("oezdemir");

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
              <span className="t-eyebrow">Sprecherpositionierung · 736 MdB · WP 12–21</span>
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
              Die Position auf der waagerechten Achse zeigt, wessen Sprache — AfD oder Grüne — die
              Reden dieses MdB rhetorisch näherkommen.
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
                <PartyDot id="afd" size={9} /> AfD
              </div>
              <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                ↔
              </span>
              <div className="chip" style={{ height: 28, padding: "0 12px" }}>
                <PartyDot id="grn" size={9} /> Grüne
              </div>
              <span
                style={{ width: 1, height: 22, background: "var(--hairline)", margin: "0 4px" }}
              />
              <span className="t-eyebrow" style={{ color: "var(--ink-2)" }}>
                Thema
              </span>
              <div className="chip" style={{ height: 28, padding: "0 12px" }}>
                Landwirtschaft <Icon name="chev" size={10} color="var(--muted)" />
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
                axisA="afd"
                axisB="grn"
                topic="Landwirtschaft"
                hoveredId={hoveredId}
                onHover={setHoveredId}
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
                    Top-Abweichler · Landwirtschaft
                  </div>
                </div>
                <span className="ki-tag">KI-Score</span>
              </div>
              {TOP_OUTLIERS.map((o) => {
                const m = MPS.find((x) => x.id === o.id);
                if (!m) return null;
                return (
                  <div
                    key={o.id}
                    style={{
                      padding: "11px 14px",
                      borderTop: "1px solid var(--hairline-2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <PartyDot id={m.party} size={10} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 11.5,
                          color: "var(--muted)",
                        }}
                      >
                        {PARTY[m.party].name} · {o.drift}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 3,
                      }}
                    >
                      <Sparkline
                        values={[0.78, 0.72, 0.68, 0.62, 0.58, 0.55, 0.52, 0.49]}
                        width={70}
                        height={18}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 9.5,
                          color: "var(--muted)",
                        }}
                      >
                        {o.n} Reden
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <BottomStrip />
    </div>
  );
}
