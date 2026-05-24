import { Link } from "@tanstack/react-router";

type Props = {
  /** Speech count for this MP — included in the message for transparency. */
  speechCount: number;
  /** Threshold the page is comparing against. */
  threshold: number;
  /** MP display name, used in the message. */
  mpName: string;
};

/**
 * Honest empty state for MPs with too few speeches to support the analytic
 * visualisations on the profile page (trajectory, cohesion, deviations).
 * Replaces the right-column analytics; the left column (header, stats, speech
 * list, distinctive phrases) keeps showing whatever real data exists.
 */
export function InsufficientDataFrame({ speechCount, threshold, mpName }: Props) {
  return (
    <div
      style={{
        border: "1px solid var(--hairline)",
        borderRadius: 8,
        padding: "28px 32px",
        background: "var(--panel-2)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="t-eyebrow" style={{ color: "var(--muted)" }}>
        Nicht genug Daten
      </div>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 500,
          fontSize: 22,
          margin: 0,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
        }}
      >
        Statistische Profile brauchen mehr Reden
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-serif)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--ink-2)",
        }}
      >
        Für {mpName} liegen aktuell {speechCount} {speechCount === 1 ? "Rede" : "Reden"} im Korpus
        vor. Trajektorien, Kohäsionswerte und thematische Abweichungen werden erst ab {threshold}{" "}
        Reden ausgewiesen — sonst wären die Aussagen statistisch nicht belastbar.
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-sans)",
          fontSize: 12.5,
          lineHeight: 1.55,
          color: "var(--muted)",
        }}
      >
        Sobald neue Sitzungen aufgenommen werden, erweitert sich auch dieses Profil automatisch.
      </p>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 4,
          fontFamily: "var(--font-sans)",
          fontSize: 12.5,
        }}
      >
        <Link
          to="/$locale/abgeordnete"
          params={{ locale: "de" }}
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          → Übersicht aller Abgeordneten
        </Link>
        <Link
          to="/$locale/atlas"
          params={{ locale: "de" }}
          style={{ color: "var(--muted)", textDecoration: "none" }}
        >
          ← Zur Karte
        </Link>
      </div>
    </div>
  );
}
