import { Link } from "@tanstack/react-router";
import { PartyDot } from "@/components/PartyDot";
import { PARTY, type PartyId } from "@/data/parties";
import profilJson from "@/data/profil-der-woche.json";

type ProfilDerWoche = {
  generatedAt: string;
  extId: string;
  name: string;
  party: string;
  role: string | null;
  speechCount: number;
  reasonScore: number;
  phrases: { phrase: string; weight: number; count: number }[];
};

const PROFIL = profilJson as ProfilDerWoche;

/**
 * Editorial-feel "Profil der Woche" card — picks the MP with the most
 * distinctive vocabulary across the corpus. Generated weekly by
 * `scripts/profil-der-woche.ts` and persisted to `src/data/profil-der-woche.json`.
 */
export function MaverickCard() {
  const party = PARTY[PROFIL.party as PartyId];
  const surname = PROFIL.name.split(" ").slice(-1).join("");

  return (
    <Link
      to="/$locale/abgeordnete/$id"
      params={{ locale: "de", id: PROFIL.extId }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "18px 22px",
        background: "var(--panel)",
        textDecoration: "none",
        color: "var(--ink)",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div className="t-eyebrow" style={{ color: "var(--accent)", marginBottom: 8 }}>
          Profil der Woche
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            color: "var(--ink)",
            marginBottom: 6,
          }}
        >
          {PROFIL.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--ink-2)",
            flexWrap: "wrap",
          }}
        >
          {party && (
            <>
              <PartyDot id={PROFIL.party as PartyId} size={9} />
              <span style={{ color: party.colorVar, fontWeight: 600 }}>{party.full}</span>
            </>
          )}
          {PROFIL.role && (
            <span style={{ color: "var(--muted)", fontSize: 11 }}>· {PROFIL.role}</span>
          )}
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-serif)",
          fontSize: 13.5,
          lineHeight: 1.5,
          color: "var(--ink-2)",
        }}
      >
        Über {PROFIL.speechCount} Reden hinweg fällt {surname} mit einer Sprache auf, die
        statistisch deutlich vom übrigen Bundestag abweicht — besonders bei diesen Begriffen:
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PROFIL.phrases.map((p) => {
          const scale = 1 + (p.weight / 12) * 0.4;
          return (
            <span
              key={p.phrase}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13 * scale,
                fontWeight: 500,
                padding: "5px 12px",
                border: `1px solid ${party?.colorVar ?? "var(--hairline)"}`,
                borderRadius: 14,
                background: "var(--bg-2)",
                color: party?.colorVar ?? "var(--ink)",
              }}
            >
              {p.phrase}
            </span>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          Top-z {PROFIL.reasonScore.toFixed(2)} · {PROFIL.speechCount} Reden
        </span>
        <span>Profil ansehen →</span>
      </div>
    </Link>
  );
}
