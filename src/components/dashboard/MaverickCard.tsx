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
const MAX_PHRASES = 5;

export function MaverickCard() {
  const party = PARTY[PROFIL.party as PartyId];
  const phrases = PROFIL.phrases.slice(0, MAX_PHRASES);

  return (
    <Link
      to="/$locale/abgeordnete/$id"
      params={{ locale: "de", id: PROFIL.extId }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 14px",
        background: "var(--panel)",
        textDecoration: "none",
        color: "var(--ink)",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        <span
          className="t-eyebrow"
          style={{ color: "var(--accent)", fontSize: 9.5, whiteSpace: "nowrap" }}
        >
          Profil der Woche
        </span>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 17,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
          }}
        >
          {PROFIL.name}
        </span>
        {party && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-sans)",
              fontSize: 10.5,
              fontWeight: 600,
              color: party.colorVar,
              whiteSpace: "nowrap",
            }}
          >
            <PartyDot id={PROFIL.party as PartyId} size={7} />
            {party.name}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            color: "var(--muted)",
            marginRight: 4,
          }}
        >
          Distinktive Begriffe:
        </span>
        {phrases.map((p) => (
          <span
            key={p.phrase}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              fontWeight: 500,
              padding: "2px 8px",
              border: `1px solid ${party?.colorVar ?? "var(--hairline)"}`,
              borderRadius: 11,
              background: "var(--bg-2)",
              color: party?.colorVar ?? "var(--ink)",
            }}
          >
            {p.phrase}
          </span>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          color: "var(--muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          z {PROFIL.reasonScore.toFixed(2)} · {PROFIL.speechCount} Reden
        </span>
        <span>Profil ansehen →</span>
      </div>
    </Link>
  );
}
