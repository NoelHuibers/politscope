import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { getAllSessions } from "@/lib/server/directory";

export const Route = createFileRoute("/$locale/sitzungen")({
  component: SitzungenIndex,
});

function germanLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function SitzungenIndex() {
  const { locale } = Route.useParams();
  const sessionsQuery = useQuery({
    queryKey: ["all-sessions"],
    queryFn: () => getAllSessions(),
  });

  return (
    <PageShell>
      <header style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 32,
            margin: 0,
            letterSpacing: "-0.012em",
          }}
        >
          Sitzungen
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--ink-2)",
            marginTop: 6,
          }}
        >
          {sessionsQuery.data
            ? `${sessionsQuery.data.length} Plenarsitzungen im Korpus, chronologisch absteigend.`
            : "Lade Sitzungen…"}
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
        {(sessionsQuery.data ?? []).map((s) => (
          <Link
            key={s.id}
            to="/$locale/sitzungen/$wp/$nr"
            params={{ locale, wp: String(s.wahlperiode), nr: String(s.sitzung) }}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              padding: "14px 16px",
              border: "1px solid var(--hairline)",
              borderRadius: 6,
              background: "var(--panel)",
              textDecoration: "none",
              color: "var(--ink)",
              transition: "border-color 0.15s ease",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  fontWeight: 500,
                  marginBottom: 2,
                }}
              >
                WP {s.wahlperiode} · {s.sitzung}. Sitzung
              </div>
              <div
                style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-2)" }}
              >
                {germanLong(s.date)}
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.speechCount} Reden
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
