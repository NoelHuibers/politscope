import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCorpusStats } from "@/lib/hooks/useCorpusStats";
import { getRecentSessions } from "@/lib/server/directory";
import * as m from "@/paraglide/messages";

/** "2026-05-20" → "20. Mai 2026" (German long form) */
function germanLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** "2026-05-20" → "20.05." */
function germanShortDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.`;
}

export function BottomStrip() {
  const stats = useCorpusStats();
  const recent = useQuery({
    queryKey: ["recent-sessions", 4],
    queryFn: () => getRecentSessions({ data: 4 }),
  });

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
          {germanLongDate(stats.data?.latestDate)}
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
        {(recent.data ?? []).map((s) => (
          <Link
            key={s.id}
            to="/$locale/sitzungen/$wp/$nr"
            params={{ locale: "de", wp: String(s.wahlperiode), nr: String(s.sitzung) }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--muted)" }}>
              {germanShortDate(s.date)}
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
              }}
            >
              WP{s.wahlperiode} · Sitzung {s.sitzung} · {s.speechCount} Reden
            </div>
          </Link>
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
