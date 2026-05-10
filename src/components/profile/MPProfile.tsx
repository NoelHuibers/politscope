"use client";

import { Icon } from "@/components/Icon";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";
import { PartyDot } from "@/components/PartyDot";
import { type MP, MPS } from "@/data/mps";
import { PARTY } from "@/data/parties";
import { useUI } from "@/state/ui";
import { ProfileSection } from "./ProfileSection";
import { Stat } from "./Stat";

type Props = {
  mpId: string;
};

const TRAJECTORY_POINTS: ReadonlyArray<readonly [number, number]> = [
  [60, 160],
  [120, 148],
  [170, 132],
  [220, 118],
  [270, 106],
  [320, 92],
  [370, 82],
  [410, 70],
  [455, 76],
  [490, 82],
  [520, 72],
  [540, 60],
];

type Deviation = {
  topic: string;
  to: string;
  pct: number;
  q: string | null;
  neutral?: boolean;
};

const DEVIATIONS: readonly Deviation[] = [
  {
    topic: "Wirtschaft & Industrie",
    to: "FDP",
    pct: 22,
    q: "„…wir brauchen private Investitionen, nicht weitere Subventionen.",
  },
  {
    topic: "Versorgungssicherheit",
    to: "CDU",
    pct: 17,
    q: "„…Resilienz unserer Lieferketten ist eine Frage nationaler Sicherheit.",
  },
  {
    topic: "Außenpolitik",
    to: "SPD",
    pct: 14,
    q: "„Diplomatie ist anstrengend — und sie ist alternativlos.",
  },
  {
    topic: "Klimaschutz",
    to: "(Median)",
    pct: 0,
    q: null,
    neutral: true,
  },
];

const DISTINCTIVE_PHRASES: ReadonlyArray<readonly [string, number]> = [
  ["dramatische Notwendigkeit", 1.4],
  ["Bedingung der Möglichkeit", 1.2],
  ["Resilienz", 1.1],
  ["fossile Pfadabhängigkeit", 1.4],
  ["soziale Marktwirtschaft", 1.0],
  ["zumutbar", 1.2],
  ["wir alle wissen", 1.1],
  ["wir tun das nicht aus Spaß", 1.3],
  ["Versorgungssicherheit", 1.2],
  ["es ist nicht einfach", 1.1],
];

function PartyLabel({ mp }: { mp: MP }) {
  const p = PARTY[mp.party];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <PartyDot id={mp.party} size={10} />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          fontWeight: 600,
          color: p.colorVar,
        }}
      >
        {p.full}
      </span>
    </div>
  );
}

export function MPProfile({ mpId }: Props) {
  const theme = useUI((s) => s.theme);
  const dark = theme === "dark";
  const mp = MPS.find((m) => m.id === mpId) ?? MPS[2];
  if (!mp) return null;

  const [first, last] = mp.name.split(" ");

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
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <LeftRail />
        <div
          className="scroll-y"
          style={{
            flex: 1,
            padding: "26px 32px 18px",
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 28,
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          {/* Header column */}
          <div>
            <div
              style={{
                width: 200,
                height: 240,
                background: "linear-gradient(180deg, var(--bg-2), var(--panel))",
                border: "1px solid var(--hairline)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 12,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <svg viewBox="0 0 100 120" width="120" height="144" aria-hidden="true">
                <circle cx="50" cy="42" r="20" fill="var(--hairline)" />
                <path d="M14 120 C 14 80 86 80 86 120 Z" fill="var(--hairline)" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "var(--muted)",
                }}
              >
                Foto: Wikidata, sofern lizenziert
              </span>
            </div>

            <PartyLabel mp={mp} />
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
                fontSize: 30,
                margin: "0 0 4px",
                letterSpacing: "-0.012em",
                lineHeight: 1.05,
              }}
            >
              {first}
              {last && (
                <>
                  <br />
                  {last}
                </>
              )}
            </h1>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--ink-2)",
                marginBottom: 10,
              }}
            >
              {mp.role} · MdB seit {mp.since}
              <br />
              ehem. Bundesminister für Wirtschaft
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "12px 14px",
                background: "var(--panel-2)",
                border: "1px solid var(--hairline)",
                borderRadius: 4,
              }}
            >
              <Stat label="Reden gesamt" value={mp.n.toString()} />
              <Stat label="Erste Rede" value="14. März 2018" />
              <Stat label="Letzte Rede" value="08. Mai 2026" />
              <Stat label="Ø Redelänge" value="6:42 min" />
              <Stat
                label={`Kohäsion · ${PARTY[mp.party].name}`}
                value={mp.coh?.toFixed(2) ?? "—"}
                hint={mp.coh && mp.coh > 0.75 ? "Hoch — auf Linie" : undefined}
              />
            </div>

            <a
              href="https://www.abgeordnetenwatch.de"
              target="_blank"
              rel="noreferrer noopener"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 14,
                fontFamily: "var(--font-sans)",
                fontSize: 11.5,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              <Icon name="chevR" size={11} color="var(--accent)" /> Stimmverhalten auf
              abgeordnetenwatch.de
            </a>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
            <ProfileSection
              title="Trajektorie im semantischen Raum"
              eyebrow={`Embedding · ${mp.since} → 2026`}
              hint="Quartalsweiser Verlauf der Reden, projiziert. Annotiert: thematische Wendepunkte."
              ki
            >
              <div
                style={{
                  position: "relative",
                  height: 220,
                  background: "var(--map-bg)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <svg
                  viewBox="0 0 600 220"
                  width="100%"
                  height="220"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 60 160 C 120 140, 180 130, 240 110 S 360 80, 410 70 S 510 90, 540 60"
                    stroke={PARTY[mp.party].colorVar}
                    strokeWidth="1.6"
                    fill="none"
                    strokeOpacity="0.85"
                  />
                  {TRAJECTORY_POINTS.map(([cx, cy], i) => (
                    <circle
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable static positions
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={i === 7 ? 5 : 2.6}
                      fill={PARTY[mp.party].colorVar}
                      stroke={i === 7 ? (dark ? "#0e1014" : "#fff") : "none"}
                      strokeWidth={i === 7 ? 1.5 : 0}
                    />
                  ))}
                  <line
                    x1="410"
                    y1="70"
                    x2="410"
                    y2="34"
                    stroke="var(--muted)"
                    strokeDasharray="2 3"
                  />
                  <text
                    x="412"
                    y="28"
                    fontFamily="var(--font-sans)"
                    fontSize="10.5"
                    fontWeight="600"
                    fill="var(--ink)"
                  >
                    Energiekrise · 2022
                  </text>
                  <text
                    x="412"
                    y="42"
                    fontFamily="var(--font-sans)"
                    fontSize="10"
                    fill="var(--muted)"
                  >
                    Pivot Richtung Versorgungssicherheit
                  </text>
                </svg>
              </div>
            </ProfileSection>

            <ProfileSection
              title="Kohäsion über Zeit"
              eyebrow="Übereinstimmung mit eigener Fraktion"
              hint="Werte: 1.0 = volle rhetorische Übereinstimmung mit dem Median der Fraktion."
            >
              <div style={{ height: 90, position: "relative" }}>
                <svg
                  viewBox="0 0 600 90"
                  width="100%"
                  height="90"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line x1="0" y1="40" x2="600" y2="40" stroke="var(--hairline)" />
                  <text x="2" y="14" fontFamily="var(--font-mono)" fontSize="9" fill="var(--muted)">
                    1.0
                  </text>
                  <text x="2" y="86" fontFamily="var(--font-mono)" fontSize="9" fill="var(--muted)">
                    0.5
                  </text>
                  <path
                    d="M 30 38 L 80 30 L 130 24 L 180 22 L 230 18 L 280 16 L 330 14 L 380 22 L 430 30 L 480 26 L 530 22 L 580 18"
                    stroke={PARTY[mp.party].colorVar}
                    strokeWidth="1.6"
                    fill="none"
                  />
                  <path
                    d="M 30 38 L 80 30 L 130 24 L 180 22 L 230 18 L 280 16 L 330 14 L 380 22 L 430 30 L 480 26 L 530 22 L 580 18 L 580 88 L 30 88 Z"
                    fill={PARTY[mp.party].colorVar}
                    opacity="0.10"
                  />
                </svg>
              </div>
            </ProfileSection>

            <ProfileSection
              title="Charakteristische Abweichungen"
              eyebrow="Wo seine Sprache von der Fraktion abweicht"
              ki
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {DEVIATIONS.map((d) => (
                  <div
                    key={d.topic}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--hairline)",
                      borderRadius: 4,
                      background: d.neutral ? "transparent" : "var(--panel-2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {d.topic}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          color: d.neutral ? "var(--muted)" : "var(--accent)",
                        }}
                      >
                        {d.neutral ? "auf Linie" : `+${d.pct} % Richtung ${d.to}`}
                      </span>
                    </div>
                    {d.q && (
                      <div
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 12,
                          fontStyle: "italic",
                          color: "var(--ink-2)",
                          lineHeight: 1.4,
                        }}
                      >
                        {d.q}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ProfileSection>

            <ProfileSection
              title="Charakteristische Wendungen"
              eyebrow="Scattertext für eine Person"
              hint={`Phrasen, die ${last ?? mp.name} signifikant häufiger nutzt als der Bundestag insgesamt.`}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DISTINCTIVE_PHRASES.map(([w, s]) => (
                  <span
                    key={w}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12 * s,
                      fontWeight: 500,
                      padding: "4px 10px",
                      border: "1px solid var(--hairline)",
                      borderRadius: 12,
                      background: "var(--bg-2)",
                      color: "var(--ink)",
                    }}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </ProfileSection>
          </div>
        </div>
      </div>
      <BottomStrip />
    </div>
  );
}
