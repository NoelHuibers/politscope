import { Icon } from "@/components/Icon";

export function GlossaryNote() {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: "var(--bg-2)",
        borderLeft: "2px solid var(--accent)",
        fontFamily: "var(--font-sans)",
        fontSize: 12,
        lineHeight: 1.5,
        color: "var(--ink-2)",
        borderRadius: "0 4px 4px 0",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <Icon name="info" size={14} color="var(--accent)" />
      <div>
        <b style={{ color: "var(--ink)" }}>Sprachstil ≠ Stimmverhalten.</b> Diese Ansicht beschreibt
        rhetorische Ähnlichkeit, nicht Ideologie und nicht Abstimmungsverhalten. Wer „klingt wie X“
        stimmt nicht zwangsläufig wie X. Belegabstimmungen →{" "}
        <a
          href="https://www.abgeordnetenwatch.de"
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          abgeordnetenwatch.de
        </a>
        .
      </div>
    </div>
  );
}
