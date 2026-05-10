type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function Stat({ label, value, hint }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--muted)" }}>
        {label}
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          {value}
        </span>
        {hint && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--muted)" }}>
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}
