import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { MethodologyModal } from "@/components/dashboard/MethodologyModal";
import { Icon } from "@/components/Icon";
import { TopBar } from "@/components/layout/TopBar";
import { formatGerman, useCorpusStats } from "@/lib/hooks/useCorpusStats";

const LENSES = [
  {
    eyebrow: "Atlas · Embedding-Karte",
    title: "Sehen, worüber gerade gesprochen wird",
    body: "Jede Rede wird in einen 1536-dimensionalen Bedeutungsraum eingebettet und auf 2D projiziert. Themen-Cluster werden automatisch erkannt und benannt — Wärmeplanung sitzt neben Energiewende, Migration neben Bezahlkarte.",
  },
  {
    eyebrow: "Themenfluss · Sankey",
    title: "Wie sich Themen über Wahlperioden verschieben",
    body: "Welche Themen wuchsen von WP19 nach WP20 nach WP21, welche schrumpften? Die Bandbreite jedes Clusters entspricht dem Anteil aller Reden in dieser Wahlperiode.",
  },
  {
    eyebrow: "Sprecherpositionierung",
    title: "Wer klingt wie eine andere Fraktion?",
    body: "Jede:r Abgeordnete wird auf eine Achse zwischen zwei Parteien projiziert — z. B. AfD ↔ Grüne. Abweichler erkennt man daran, dass sie näher an der falschen Pole sitzen als ihre Fraktion.",
  },
  {
    eyebrow: "Sprachprofil · Fingerprint",
    title: "Fünf rhetorische Merkmale, pro Quartal",
    body: "Satzlänge, lexikalischer Reichtum, Emotionalität, Formalität und Abweichung vom Fraktionsmedian — quartalsweise zu einer Heatmap zusammengezogen. Macht Rhetorik-Drift sichtbar.",
  },
] as const;

const PIPELINE_STEPS = [
  { n: "1", title: "Reden", body: "XML-Protokolle direkt von bundestag.de/opendata." },
  {
    n: "2",
    title: "Embeddings",
    body: "OpenAI text-embedding-3-small — 1536-dim Vektor pro Rede.",
  },
  {
    n: "3",
    title: "Cluster + UMAP",
    body: "k-means für Themen, UMAP für die 2D-Projektion. c-TF-IDF benennt jeden Cluster.",
  },
  {
    n: "4",
    title: "Visualisierung",
    body: "Atlas, Sankey, Positionierung, Wortvergleich, Fingerprint — alles aus denselben Daten.",
  },
] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 36,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function LandingPage() {
  const params = useParams({ strict: false });
  const locale = (params.locale as string | undefined) ?? "de";
  const stats = useCorpusStats();
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const totalSpeeches = formatGerman(stats.data?.totalSpeeches);
  const totalMps = formatGerman(stats.data?.totalMps);
  const totalSessions = formatGerman(stats.data?.totalSessions);
  const dateRange =
    stats.data?.earliestDate && stats.data?.latestDate
      ? `${stats.data.earliestDate.slice(0, 4)} – ${stats.data.latestDate.slice(0, 4)}`
      : "—";

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <TopBar />
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Hero */}
        <section
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "72px 28px 56px",
          }}
        >
          <div
            className="t-eyebrow"
            style={{
              color: "var(--accent)",
              marginBottom: 18,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            Bundestag Speech Analysis
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "clamp(40px, 6vw, 64px)",
              letterSpacing: "-0.022em",
              lineHeight: 1.04,
              margin: 0,
              maxWidth: 880,
              color: "var(--ink)",
            }}
          >
            Wie klingt der Bundestag — <span style={{ color: "var(--accent)" }}>wirklich?</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(17px, 1.6vw, 21px)",
              lineHeight: 1.5,
              color: "var(--ink-2)",
              marginTop: 18,
              maxWidth: 680,
            }}
          >
            PolitScope analysiert alle Reden des Deutschen Bundestages: was gesagt wird, wer wie
            spricht und wie sich Sprache über Wahlperioden hinweg verschiebt. Keine Schlagzeile,
            kein Spin — die Reden selbst.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/$locale/atlas"
              params={{ locale }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "var(--ink)",
                color: "var(--bg)",
                textDecoration: "none",
                borderRadius: 6,
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Atlas öffnen <Icon name="chevR" size={12} color="var(--bg)" />
            </Link>
            <button
              type="button"
              onClick={() => setMethodologyOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "transparent",
                color: "var(--ink-2)",
                border: "1px solid var(--hairline)",
                borderRadius: 6,
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Icon name="info" size={12} color="var(--ink-2)" /> Methodik
            </button>
          </div>

          {/* Corpus stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 32,
              marginTop: 56,
              paddingTop: 32,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <Stat label="Reden" value={totalSpeeches} />
            <Stat label="MdB" value={totalMps} />
            <Stat label="Sitzungen" value={totalSessions} />
            <Stat label="Zeitraum" value={dateRange} />
          </div>
        </section>

        {/* Lenses */}
        <section
          style={{
            background: "var(--panel)",
            borderTop: "1px solid var(--hairline)",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div style={{ maxWidth: 980, margin: "0 auto", padding: "64px 28px" }}>
            <div className="t-eyebrow" style={{ color: "var(--muted)", marginBottom: 12 }}>
              Vier Perspektiven
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
                fontSize: 32,
                letterSpacing: "-0.012em",
                margin: 0,
                marginBottom: 36,
                maxWidth: 760,
              }}
            >
              Dieselben Reden, vier Lesarten — von der Vogelperspektive bis zum einzelnen MdB.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {LENSES.map((l) => (
                <article
                  key={l.title}
                  style={{
                    padding: "20px 22px",
                    background: "var(--panel-2)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span className="t-eyebrow" style={{ color: "var(--accent)", fontSize: 10 }}>
                    {l.eyebrow}
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      fontWeight: 500,
                      letterSpacing: "-0.005em",
                      margin: 0,
                      lineHeight: 1.2,
                      color: "var(--ink)",
                    }}
                  >
                    {l.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: "var(--ink-2)",
                      margin: 0,
                    }}
                  >
                    {l.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section style={{ maxWidth: 980, margin: "0 auto", padding: "64px 28px" }}>
          <div className="t-eyebrow" style={{ color: "var(--muted)", marginBottom: 12 }}>
            Pipeline
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: "-0.012em",
              margin: 0,
              marginBottom: 36,
              maxWidth: 760,
            }}
          >
            Wie aus Plenarprotokollen Visualisierungen werden.
          </h2>
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {PIPELINE_STEPS.map((s) => (
              <li
                key={s.n}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "18px 20px",
                  borderLeft: "2px solid var(--accent)",
                  background: "var(--panel-2)",
                  borderRadius: "0 6px 6px 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--accent)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Schritt {s.n}
                </span>
                <strong
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {s.title}
                </strong>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: "var(--ink-2)",
                    margin: 0,
                  }}
                >
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Honest disclaimer */}
        <section
          style={{
            background: "var(--bg-2)",
            borderTop: "1px solid var(--hairline)",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div
            style={{
              maxWidth: 980,
              margin: "0 auto",
              padding: "48px 28px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 40,
              alignItems: "start",
            }}
          >
            <div>
              <div className="t-eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
                Was PolitScope nicht ist
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.008em",
                  margin: 0,
                  marginBottom: 12,
                  color: "var(--ink)",
                  lineHeight: 1.25,
                }}
              >
                Sprachstil ≠ Stimmverhalten.
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                Wer klingt wie X stimmt nicht zwangsläufig wie X. PolitScope misst, womit jemand
                sich rhetorisch beschäftigt — nicht, wofür sie:er die Hand hebt. Stimmverhalten
                gehört nach abgeordnetenwatch.de.
              </p>
            </div>
            <div>
              <div className="t-eyebrow" style={{ color: "var(--muted)", marginBottom: 12 }}>
                Datenquelle
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                Alle Reden stammen direkt aus dem Open-Data-Angebot des Deutschen Bundestages —
                offiziell, vollständig und in maschinenlesbarem XML.
              </p>
              <a
                href="https://www.bundestag.de/services/opendata"
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                bundestag.de/services/opendata →
              </a>
            </div>
          </div>
        </section>

        {/* CTA repeat */}
        <section
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "72px 28px 96px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 500,
              letterSpacing: "-0.014em",
              margin: 0,
              color: "var(--ink)",
              lineHeight: 1.1,
            }}
          >
            Selbst nachsehen.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              marginTop: 14,
              marginBottom: 28,
              maxWidth: 540,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Vier Vizes, eine Karte aller Reden, jedes MdB anklickbar.
          </p>
          <Link
            to="/$locale/atlas"
            params={{ locale }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              background: "var(--ink)",
              color: "var(--bg)",
              textDecoration: "none",
              borderRadius: 6,
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Atlas öffnen <Icon name="chevR" size={13} color="var(--bg)" />
          </Link>
        </section>
      </main>

      <footer
        style={{
          background: "var(--panel)",
          borderTop: "1px solid var(--hairline)",
          padding: "24px 28px",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--muted)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span>
            PolitScope · Daten ©{" "}
            <a
              href="https://www.bundestag.de/services/opendata"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Deutscher Bundestag
            </a>
          </span>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMethodologyOpen(true)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--ink-2)",
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Methodik
            </button>
            <a
              href="https://github.com/NoelHuibers/politscope"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "var(--ink-2)", textDecoration: "none" }}
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <MethodologyModal open={methodologyOpen} onOpenChange={setMethodologyOpen} />
    </div>
  );
}
