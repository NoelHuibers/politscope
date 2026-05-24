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
        padding: "6px 12px 6px",
        borderBottom: "1px solid var(--hairline-2)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="t-eyebrow" style={{ fontSize: 9.5 }}>
            {eyebrow}
          </span>
          {ki && (
            <span className="ki-tag" style={{ fontSize: 9 }}>
              KI
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            marginTop: 1,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={title}
        >
          {title}
        </div>
        {hint && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10.5,
              color: "var(--muted)",
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={hint}
          >
            {hint}
          </div>
        )}
      </div>
      {right && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>{right}</div>
      )}
    </div>
  );
}
