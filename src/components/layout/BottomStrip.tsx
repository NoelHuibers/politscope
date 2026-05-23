import { RECENT_DEBATES } from "@/data/debates";
import * as m from "@/paraglide/messages";

export function BottomStrip() {
  return (
    <div
      style={{
        height: 64,
        flex: "0 0 64px",
        background: "var(--panel)",
        borderTop: "1px solid var(--hairline)",
        padding: "0 22px",
        display: "grid",
        gridTemplateColumns: "260px 1fr 220px",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {m.bottom_as_of()}
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 16,
            fontWeight: 500,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          12. Mai 2026 · 14:22
          <span
            className="pulse"
            style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, overflow: "hidden", justifyContent: "center" }}>
        <span className="t-eyebrow" style={{ alignSelf: "center" }}>
          {m.bottom_recent_sessions()}
        </span>
        {RECENT_DEBATES.slice(0, 4).map((d) => (
          <div
            key={`${d.date}-${d.title}`}
            style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--muted)" }}>
              {d.date}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--ink-2)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 200,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {d.hot && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
              {d.title}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "right" }}>
        <div className="t-eyebrow">{m.bottom_data_source()}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-2)" }}>
          bundestag.de · täglich ·{" "}
          <span style={{ color: "var(--accent)" }}>{m.bottom_active()}</span>
        </div>
      </div>
    </div>
  );
}
