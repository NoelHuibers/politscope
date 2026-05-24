import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/Icon";
import { ModalFrame } from "@/components/ModalFrame";
import { formatGerman } from "@/lib/hooks/useCorpusStats";
import { getMethodology, type MethodologyData } from "@/lib/server/methodology";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function germanShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function germanDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

type StepRow = { eb: string; t: string; d: string };

function steps(data: MethodologyData): StepRow[] {
  const c = data.corpus;
  const dateRange =
    c.earliestDate && c.latestDate
      ? `${germanShort(c.earliestDate)} – ${germanShort(c.latestDate)}`
      : "—";

  return [
    {
      eb: "1 · Datenquelle",
      t: "Bundestag · Open Data",
      d: `Plenarprotokolle (XML). Aktuell ${formatGerman(c.totalSpeeches)} Reden aus ${formatGerman(c.totalSessions)} Sitzungen, ${formatGerman(c.totalMps)} Abgeordnete. Zeitraum: ${dateRange}. Quelle wird täglich abgeglichen, sobald die Sitzungsprotokolle veröffentlicht sind.`,
    },
    {
      eb: "2 · Embedding",
      t: `Modell: ${data.embedding.model}`,
      d: `Jede Rede wird in einen ${data.embedding.dim}-dimensionalen Bedeutungsvektor umgewandelt. Aktuell ${formatGerman(data.embedding.count)} Reden eingebettet. Das Modell ist mehrsprachig, deutscher Text wird unverändert verarbeitet.`,
    },
    {
      eb: "3 · 2D-Projektion",
      t: `UMAP (n_neighbors=${data.umap.nNeighbors}, min_dist=${data.umap.minDist})`,
      d: `Aus dem ${data.embedding.dim}-D Vektorraum wird mit UMAP eine 2D-Karte (Atlas) erzeugt. ${formatGerman(data.umap.count)} Reden projiziert. Globale Strukturen bleiben erhalten; Nähe auf der Karte ≈ semantische Ähnlichkeit der Reden.`,
    },
    {
      eb: "4 · Themen-Cluster",
      t: data.clustering.method,
      d: `${data.clustering.k} Cluster über alle Reden gebildet, davon aktuell ${data.clustering.activeClusters} im Datensatz vertreten. Bezeichnungen stammen aus c-TF-IDF gegen den Rest des Korpus. Generiert: ${germanDateTime(data.clustering.generatedAt)}.`,
    },
    {
      eb: "5 · Charakteristische Wendungen",
      t: "Log-Odds-Ratio mit Dirichlet-Prior",
      d: `Pro Abgeordnete:r werden Wörter ermittelt, die statistisch häufiger genutzt werden als im Gesamt-Korpus. Methode: Monroe, Colaresi & Quinn (2008), Prior α=${data.distinctivePhrases.alpha}, Mindesthäufigkeit ${data.distinctivePhrases.minCount}. Eigennamen und prozedurale Floskeln werden gefiltert.`,
    },
    {
      eb: "6 · Bekannte Grenzen",
      t: "Was diese Werkzeuge nicht zeigen",
      d: "Sprachstil ≠ Stimmverhalten. Reden im Plenum sind kuratierter Diskurs, nicht private Meinung. Ironie und rhetorische Fragen werden nicht zuverlässig erkannt. Bei wenigen Reden pro Person ist die Auswertung statistisch instabil.",
    },
  ];
}

export function MethodologyModal({ open, onOpenChange }: Props) {
  const methodology = useQuery({
    queryKey: ["methodology"],
    queryFn: () => getMethodology(),
    enabled: open,
  });

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
          PolitScope rechnet jede Bundestagsrede in einen Bedeutungsvektor um, gruppiert sie zu
          Themen und vergleicht sie nach stilistischen Merkmalen. Die folgenden Schritte sind
          transparent und reproduzierbar — der Quellcode liegt offen, alle Parameter sind unten
          aufgeführt.
        </p>

        {methodology.isPending && (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Lade Methodik-Daten…</div>
        )}

        {methodology.data &&
          steps(methodology.data).map((s, i, arr) => (
            <div
              key={s.eb}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 16,
                paddingBottom: 14,
                borderBottom: i < arr.length - 1 ? "1px solid var(--hairline-2)" : "none",
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
          {methodology.data && (
            <>
              <a
                href={methodology.data.links.github}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost"
                style={{ textDecoration: "none" }}
              >
                <Icon name="book" size={12} /> GitHub-Repository
              </a>
              <a
                href={methodology.data.links.dataSource}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost"
                style={{ textDecoration: "none" }}
              >
                <Icon name="download" size={12} /> bundestag.de Open Data
              </a>
            </>
          )}
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--muted)",
            }}
          >
            Letzte Cluster-Berechnung:{" "}
            {methodology.data ? germanDateTime(methodology.data.clustering.generatedAt) : "—"}
          </span>
        </div>
      </div>
    </ModalFrame>
  );
}
