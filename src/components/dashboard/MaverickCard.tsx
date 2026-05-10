import { Icon } from "@/components/Icon";
import { PartyDot } from "@/components/PartyDot";

type Props = {
  dense?: boolean;
};

export function MaverickCard({ dense = false }: Props) {
  return (
    <div
      style={{
        background: "var(--panel-2)",
        border: "1px solid var(--hairline)",
        borderRadius: 6,
        padding: dense ? "12px 14px" : "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span className="t-eyebrow" style={{ color: "var(--accent)" }}>
          Profil der Woche · KW 19
        </span>
        <span className="ki-tag">Redaktionell ausgewählt</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PartyDot id="grn" size={10} />
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
          }}
        >
          Cem Özdemir
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)" }}>
          Grüne · MdB
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-sans)",
          fontSize: 12.5,
          lineHeight: 1.45,
          color: "var(--ink-2)",
        }}
      >
        Bei Reden zur <b>Landwirtschaft</b> verwendet er Vokabular, das stärker mit SPD- und
        FDP-Beiträgen übereinstimmt als mit dem Durchschnitt seiner eigenen Fraktion.{" "}
        <span style={{ color: "var(--muted)" }}>Beobachtet seit 19. Wahlperiode.</span>
      </p>
      <blockquote
        style={{
          margin: 0,
          padding: "10px 12px",
          borderLeft: "2px solid var(--accent)",
          fontFamily: "var(--font-serif)",
          fontSize: 14,
          fontStyle: "italic",
          lineHeight: 1.4,
          color: "var(--ink)",
        }}
      >
        „Landwirtschaft braucht Verlässlichkeit, keinen ideologischen Zickzackkurs aus Berlin."
        <div
          style={{
            fontStyle: "normal",
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            color: "var(--muted)",
            marginTop: 6,
            letterSpacing: "0.04em",
          }}
        >
          18. APR 2024 · 184. SITZUNG · TOP 12 — illustrative Wiedergabe
        </div>
      </blockquote>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn-ghost">
          <Icon name="book" size={12} /> 14 Beispielreden
        </button>
        <button type="button" className="btn-ghost">
          <Icon name="info" size={12} /> Wie wird das berechnet?
        </button>
      </div>
    </div>
  );
}
