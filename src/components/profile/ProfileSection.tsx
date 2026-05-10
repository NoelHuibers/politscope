import type { ReactNode } from "react";

type Props = {
  title: string;
  eyebrow: string;
  hint?: string;
  ki?: boolean;
  children: ReactNode;
};

export function ProfileSection({ title, eyebrow, hint, ki = false, children }: Props) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span className="t-eyebrow">{eyebrow}</span>
        {ki && <span className="ki-tag">KI-generiert</span>}
      </div>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 19,
          fontWeight: 500,
          margin: "0 0 4px",
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {title}
      </h2>
      {hint && (
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--muted)",
            lineHeight: 1.45,
          }}
        >
          {hint}
        </p>
      )}
      {children}
    </section>
  );
}
