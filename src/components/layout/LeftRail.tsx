import { Icon } from "@/components/Icon";
import { PartyDot } from "@/components/PartyDot";
import { PARTIES, type PartyId } from "@/data/parties";
import { PERIODS } from "@/data/periods";
import * as m from "@/paraglide/messages";
import { useFilters } from "@/state/filters";
import { useUI } from "@/state/ui";

const SECTION_HEAD: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--muted)",
  margin: "0 0 10px",
};

const SPEECH_COUNTS: Record<PartyId, string> = {
  cdu: "187k",
  spd: "164k",
  grn: "118k",
  fdp: "78k",
  lnk: "62k",
  afd: "94k",
  csu: "54k",
  bsw: "11k",
};

export function LeftRail() {
  const [filters, setFilters] = useFilters();
  const collapsed = useUI((s) => s.leftRailCollapsed);
  const toggle = useUI((s) => s.toggleLeftRail);

  const activeSet = new Set(filters.parties);

  const toggleParty = (id: PartyId) => {
    const next = new Set(activeSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilters({ parties: Array.from(next) });
  };

  const setPeriod = (id: number) => setFilters({ period: id });

  const reset = () => setFilters({ parties: null, period: null, topic: null });

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
        width: 232,
        flex: "0 0 232px",
        background: "var(--panel)",
        borderRight: "1px solid var(--hairline)",
        padding: "20px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
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
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--ink-2)",
            marginBottom: 8,
          }}
        >
          <span>1990</span>
          <span>2026</span>
        </div>
        <div style={{ position: "relative", height: 22 }}>
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 0,
              right: 0,
              height: 2,
              background: "var(--hairline)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "62%",
              width: "30%",
              height: 2,
              background: "var(--accent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 6,
              left: "62%",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 6,
              left: "92%",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 6,
          }}
        >
          Q1 2015 – Q2 2026 · 1 248 318 Reden
        </div>
      </div>

      <div>
        <h4 style={SECTION_HEAD}>{m.leftrail_wahlperiode()}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
          {PERIODS.map((p) => {
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                  gap: 9,
                  padding: "6px 8px",
                  borderRadius: 5,
                  cursor: "pointer",
                  background: on ? "var(--bg-2)" : "transparent",
                  border: `1px solid ${on ? "var(--hairline)" : "transparent"}`,
                  textAlign: "left",
                }}
              >
                <PartyDot id={p.id} size={9} />
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: on ? "var(--ink)" : "var(--ink-2)",
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--muted)",
                  }}
                >
                  {SPEECH_COUNTS[p.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 style={SECTION_HEAD}>{m.leftrail_speaker()}</h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "var(--bg-2)",
            border: "1px solid var(--hairline)",
            borderRadius: 5,
          }}
        >
          <Icon name="search" size={12} color="var(--muted)" />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--muted)" }}>
            {m.leftrail_add_person()}
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={reset}
        className="btn-ghost"
        style={{ alignSelf: "flex-start" }}
      >
        <Icon name="reset" size={12} /> {m.leftrail_reset_filters()}
      </button>
    </aside>
  );
}
