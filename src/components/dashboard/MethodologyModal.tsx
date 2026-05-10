"use client";

import { Icon } from "@/components/Icon";
import { ModalFrame } from "@/components/ModalFrame";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STEPS = [
  {
    eb: "1 · Datenquelle",
    t: "Bundestag · Open Data",
    d: "Plenarprotokolle 1990–2026, ~1,25 Mio. Reden. Tägliche Aktualisierung 23:00 UTC. Exakte Snapshots ab Dezember 2024.",
  },
  {
    eb: "2 · Embedding",
    t: "Multilingual sentence-transformer",
    d: "Modell: deutscher Roberta-Encoder (768 dim), reduziert auf 2D mit UMAP (n_neighbors=30, min_dist=0.05). Modell-Updates werden versioniert.",
  },
  {
    eb: "3 · Cluster-Labels",
    t: "KI-generiert, manuell stichprobenartig kuratiert",
    d: "HDBSCAN-Clustering, Beschriftung über Top-c-tf-idf + LLM-Zusammenfassung. Jedes Label ist mit „KI-generiert“ markiert und enthält N-Beispiele.",
  },
  {
    eb: "4 · Sprecherpositionierung",
    t: "Kosinus-Distanz zu Fraktionsmedianen",
    d: "Pro Thema und Sprecher wird der mittlere Vektor mit den Fraktionsmedianen verglichen. Mindestens 20 Reden erforderlich, sonst „nicht ausreichend Daten“.",
  },
  {
    eb: "5 · Bekannte Grenzen",
    t: "Was diese Werkzeuge nicht zeigen",
    d: "Sprachstil ≠ Stimmverhalten. Reden im Plenum sind kuratierter Diskurs, nicht private Meinung. Ironie und rhetorische Frage werden nicht zuverlässig erkannt.",
  },
];

export function MethodologyModal({ open, onOpenChange }: Props) {
  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Hilfe · Methodik"
      title="Wie diese Visualisierungen entstehen"
      width={720}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-serif)",
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "var(--ink-2)",
          }}
        >
          PolitScope rechnet jede Bundestagsrede in einen 384-dimensionalen Bedeutungsvektor um,
          gruppiert sie zu Themen und vergleicht sie nach stilistischen Merkmalen. Die folgenden
          Schritte sind transparent und reproduzierbar — der Quellcode liegt offen.
        </p>

        {STEPS.map((s, i) => (
          <div
            key={s.eb}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: 16,
              paddingBottom: 14,
              borderBottom: i < STEPS.length - 1 ? "1px solid var(--hairline-2)" : "none",
            }}
          >
            <div className="t-eyebrow" style={{ alignSelf: "start", paddingTop: 4 }}>
              {s.eb}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 4,
                }}
              >
                {s.t}
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "var(--ink-2)",
                }}
              >
                {s.d}
              </p>
            </div>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            gap: 12,
            paddingTop: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button type="button" className="btn-ghost">
            <Icon name="download" size={12} /> Whitepaper (PDF, 22 S.)
          </button>
          <button type="button" className="btn-ghost">
            <Icon name="book" size={12} /> GitHub-Repository
          </button>
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--muted)",
            }}
          >
            Letzte Methodik-Änderung: 11.04.2026
          </span>
        </div>
      </div>
    </ModalFrame>
  );
}
