import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  hint?: string;
  right?: ReactNode;
  ki?: boolean;
};

export function PanelHead({ eyebrow, title, hint, right, ki = false }: Props) {
  return (
    <div
      style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid var(--hairline-2)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="t-eyebrow">{eyebrow}</span>
          {ki && <span className="ki-tag">KI-generiert</span>}
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 15.5,
            fontWeight: 500,
            color: "var(--ink)",
            marginTop: 3,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {hint && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              color: "var(--muted)",
              marginTop: 3,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      {right && <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{right}</div>}
    </div>
  );
}
