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
        height: 44,
        flex: "0 0 44px",
        background: "var(--panel)",
        borderTop: "1px solid var(--hairline)",
        padding: "0 18px",
        display: "grid",
        gridTemplateColumns: "220px 1fr 200px",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
        <span
          className="t-eyebrow"
          style={{ color: "var(--muted)", fontSize: 10, whiteSpace: "nowrap" }}
        >
          {m.bottom_as_of()}
        </span>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {germanLongDate(stats.data?.latestDate)}
        </span>
        <span
          className="pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
            flex: "0 0 6px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 14,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span
          className="t-eyebrow"
          style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}
        >
          {m.bottom_recent_sessions()}
        </span>
        {(recent.data ?? []).map((s) => (
          <Link
            key={s.id}
            to="/$locale/sitzungen/$wp/$nr"
            params={{ locale: "de", wp: String(s.wahlperiode), nr: String(s.sitzung) }}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              minWidth: 0,
              textDecoration: "none",
              color: "inherit",
              fontFamily: "var(--font-sans)",
              fontSize: 11,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--muted)" }}>
              {germanShortDate(s.date)}
            </span>
            <span
              style={{
                fontWeight: 500,
                color: "var(--ink-2)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              WP{s.wahlperiode}·{s.sitzung}
            </span>
          </Link>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          justifyContent: "flex-end",
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/$locale/impressum"
          params={{ locale: "de" }}
          style={{ color: "var(--muted)", textDecoration: "none" }}
        >
          Impressum
        </Link>
        <Link
          to="/$locale/datenschutz"
          params={{ locale: "de" }}
          style={{ color: "var(--muted)", textDecoration: "none" }}
        >
          Datenschutz
        </Link>
        <span style={{ color: "var(--ink-2)" }}>bundestag.de</span>
        <span style={{ color: "var(--accent)" }}>· {m.bottom_active()}</span>
      </div>
    </div>
  );
}
