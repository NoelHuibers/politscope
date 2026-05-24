import { Icon } from "@/components/Icon";
import { PartyDot } from "@/components/PartyDot";
import { PARTIES, type PartyId } from "@/data/parties";
import { PERIODS } from "@/data/periods";
import { formatGerman, useCorpusStats } from "@/lib/hooks/useCorpusStats";
import * as m from "@/paraglide/messages";
import { useFilters } from "@/state/filters";
import { useUI } from "@/state/ui";

function compactCount(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("de-DE");
}

const SECTION_HEAD: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  margin: "0 0 6px",
};

/** "2026-05-20" → "Q2 2026"; null → fallback string */
function quarterLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const match = iso.match(/^(\d{4})-(\d{2})/);
  if (!(match?.[1] && match[2])) return "—";
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const q = Math.ceil(month / 3);
  return `Q${q} ${year}`;
}

export function LeftRail() {
  const [filters, setFilters] = useFilters();
  const collapsed = useUI((s) => s.leftRailCollapsed);
  const toggle = useUI((s) => s.toggleLeftRail);
  const stats = useCorpusStats();
  const availableWps = stats.data?.availableWps ?? [];
  const speechesByParty = stats.data?.speechesByParty ?? {};

  const activeSet = new Set(filters.parties);

  const toggleParty = (id: PartyId) => {
    const next = new Set(activeSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilters({ parties: Array.from(next) });
  };

  const setPeriod = (id: number) => setFilters({ period: id });

  const reset = () => setFilters({ parties: null, period: null, topic: null });

  // True when any filter differs from defaults — drives the reset-button styling
  // and the "Filter aktiv" affordance.
  const filtersActive =
    filters.parties.length !== PARTIES.length || filters.period !== 21 || filters.topic !== null;

  if (collapsed) {
    return (
      <aside
        style={{
          width: 28,
          flex: "0 0 28px",
          background: "var(--panel)",
          borderRight: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 14,
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={m.leftrail_open()}
          title={m.leftrail_open()}
          style={{
            background: "transparent",
            border: "1px solid var(--hairline)",
            borderRadius: 4,
            width: 22,
            height: 22,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ink-2)",
          }}
        >
          <Icon name="chevR" size={11} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 184,
        flex: "0 0 184px",
        background: "var(--panel)",
        borderRight: "1px solid var(--hairline)",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={m.leftrail_close()}
        title={m.leftrail_close()}
        style={{
          position: "absolute",
          top: 14,
          right: 10,
          background: "transparent",
          border: "1px solid var(--hairline)",
          borderRadius: 4,
          width: 22,
          height: 22,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--ink-2)",
          zIndex: 1,
        }}
      >
        <Icon name="chevL" size={11} />
      </button>

      <div>
        <h4 style={SECTION_HEAD}>{m.leftrail_period()}</h4>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-2)",
            marginBottom: 4,
          }}
        >
          {quarterLabel(stats.data?.earliestDate)} – {quarterLabel(stats.data?.latestDate)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--muted)",
          }}
        >
          {formatGerman(stats.data?.totalSpeeches)} Reden im Korpus
        </div>
      </div>

      <div>
        <h4 style={SECTION_HEAD}>{m.leftrail_wahlperiode()}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
          {PERIODS.filter((p) => availableWps.includes(p.id)).map((p) => {
            const on = filters.period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "6px 0",
                  borderRadius: 4,
                  cursor: "pointer",
                  border: "1px solid var(--hairline)",
                  background: on ? "var(--ink)" : "transparent",
                  color: on ? "var(--bg)" : "var(--ink-2)",
                }}
              >
                {p.id}.
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 style={SECTION_HEAD}>{m.leftrail_factions()}</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PARTIES.map((p) => {
            const on = activeSet.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleParty(p.id)}
                aria-pressed={on}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "3px 6px",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: on ? "var(--bg-2)" : "transparent",
                  border: `1px solid ${on ? "var(--hairline)" : "transparent"}`,
                  textAlign: "left",
                }}
              >
                <PartyDot id={p.id} size={8} />
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    fontWeight: 500,
                    color: on ? "var(--ink)" : "var(--ink-2)",
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    color: "var(--muted)",
                  }}
                >
                  {compactCount(speechesByParty[p.id])}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={reset}
        className="btn-ghost"
        disabled={!filtersActive}
        style={{
          alignSelf: "flex-start",
          opacity: filtersActive ? 1 : 0.45,
          color: filtersActive ? "var(--accent)" : "var(--muted)",
          fontWeight: filtersActive ? 600 : 400,
          cursor: filtersActive ? "pointer" : "default",
        }}
      >
        <Icon name="reset" size={12} color={filtersActive ? "var(--accent)" : "var(--muted)"} />{" "}
        {m.leftrail_reset_filters()}
      </button>
    </aside>
  );
}
