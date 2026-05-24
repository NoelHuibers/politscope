import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SpeechListItem } from "@/components/SpeechListItem";
import { getSpeechesBySession } from "@/lib/server/directory";
import { useUI } from "@/state/ui";

export const Route = createFileRoute("/$locale/sitzungen/$wp/$nr")({
  loader: async ({ params }) => {
    const wahlperiode = Number.parseInt(params.wp, 10);
    const sitzung = Number.parseInt(params.nr, 10);
    if (Number.isNaN(wahlperiode) || Number.isNaN(sitzung)) throw notFound();
    return { wahlperiode, sitzung };
  },
  component: SessionDetail,
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

function SessionDetail() {
  const { locale } = Route.useParams();
  const { wahlperiode, sitzung } = Route.useLoaderData();
  const openSpeechInspector = useUI((s) => s.openSpeechInspector);

  const speechesQuery = useQuery({
    queryKey: ["speeches-by-session", wahlperiode, sitzung],
    queryFn: () => getSpeechesBySession({ data: { wahlperiode, sitzung } }),
  });

  const firstSpeech = speechesQuery.data?.[0];
  const sessionDate = firstSpeech?.sessionDate;

  return (
    <PageShell>
      <nav style={{ marginBottom: 14, fontFamily: "var(--font-sans)", fontSize: 12.5 }}>
        <Link
          to="/$locale/sitzungen"
          params={{ locale }}
          style={{ color: "var(--muted)", textDecoration: "none" }}
        >
          ← Alle Sitzungen
        </Link>
      </nav>

      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 30,
            margin: 0,
            letterSpacing: "-0.012em",
          }}
        >
          WP {wahlperiode} · {sitzung}. Sitzung
        </h1>
        <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 6 }}>
          {sessionDate ? germanLong(sessionDate) : "—"}
          {speechesQuery.data && (
            <span style={{ color: "var(--muted)" }}> · {speechesQuery.data.length} Reden</span>
          )}
        </div>
      </header>

      {speechesQuery.isPending && (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Lade Reden…</div>
      )}
      {speechesQuery.data && speechesQuery.data.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Keine Reden in dieser Sitzung gefunden.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 880 }}>
        {(speechesQuery.data ?? []).map((s) => (
          <SpeechListItem
            key={s.id}
            speech={s}
            showSession={false}
            onSelect={openSpeechInspector}
          />
        ))}
      </div>
    </PageShell>
  );
}
