import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PartyDot } from "@/components/PartyDot";
import { PARTY, type PartyId } from "@/data/parties";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { getAllMps } from "@/lib/server/directory";

export const Route = createFileRoute("/$locale/abgeordnete/")({
  component: MpDirectory,
});

type SortKey = "name" | "party" | "speeches";

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  party: "Fraktion",
  speeches: "Reden",
};

function SortChips({
  sortKey,
  toggleSort,
  sortIndicator,
}: {
  sortKey: SortKey;
  toggleSort: (k: SortKey) => void;
  sortIndicator: (k: SortKey) => string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 4,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        flexWrap: "wrap",
      }}
    >
      {(["name", "party", "speeches"] as const).map((k) => {
        const on = sortKey === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => toggleSort(k)}
            style={{
              padding: "4px 10px",
              border: `1px solid ${on ? "var(--ink)" : "var(--hairline)"}`,
              background: on ? "var(--ink)" : "transparent",
              color: on ? "var(--bg)" : "var(--ink-2)",
              borderRadius: 4,
              cursor: "pointer",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {SORT_LABELS[k]}
            {sortIndicator(k)}
          </button>
        );
      })}
    </div>
  );
}

function MpDirectory() {
  const { locale } = Route.useParams();
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<SortKey>("speeches");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const mpsQuery = useQuery({
    queryKey: ["all-mps"],
    queryFn: () => getAllMps(),
  });

  const sorted = (() => {
    if (!mpsQuery.data) return [];
    const arr = [...mpsQuery.data];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name, "de");
      else if (sortKey === "party") cmp = a.party.localeCompare(b.party);
      else cmp = a.speechCount - b.speechCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  })();

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "speeches" ? "desc" : "asc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <PageShell>
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 32,
            margin: 0,
            letterSpacing: "-0.012em",
          }}
        >
          Abgeordnete
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--ink-2)",
            marginTop: 6,
          }}
        >
          {mpsQuery.data ? `${mpsQuery.data.length} MdB im Korpus.` : "Lade…"}
        </p>
      </header>

      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Mobile: card list with sort chips. */}
          <SortChips sortKey={sortKey} toggleSort={toggleSort} sortIndicator={sortIndicator} />
          {sorted.map((mp) => {
            const party = PARTY[mp.party as PartyId];
            return (
              <Link
                key={mp.id}
                to="/$locale/abgeordnete/$id"
                params={{ locale, id: mp.extId }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--panel)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 6,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {party && <PartyDot id={mp.party as PartyId} size={8} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--ink)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {mp.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      color: party?.textColorVar ?? "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    {party?.name ?? "—"}
                    {mp.role && (
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                        {" · "}
                        {mp.role}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                    color: mp.speechCount === 0 ? "var(--muted)" : "var(--ink-2)",
                    flexShrink: 0,
                  }}
                >
                  {mp.speechCount}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            background: "var(--panel)",
            maxWidth: 920,
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}
          >
            <thead>
              <tr style={{ background: "var(--bg-2)", textAlign: "left" }}>
                <th
                  onClick={() => toggleSort("name")}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  Name{sortIndicator("name")}
                </th>
                <th
                  onClick={() => toggleSort("party")}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    cursor: "pointer",
                    userSelect: "none",
                    width: 180,
                  }}
                >
                  Fraktion{sortIndicator("party")}
                </th>
                <th
                  onClick={() => toggleSort("speeches")}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    cursor: "pointer",
                    userSelect: "none",
                    textAlign: "right",
                    width: 110,
                  }}
                >
                  Reden{sortIndicator("speeches")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((mp) => {
                const party = PARTY[mp.party as PartyId];
                return (
                  <tr key={mp.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <Link
                        to="/$locale/abgeordnete/$id"
                        params={{ locale, id: mp.extId }}
                        style={{
                          color: "var(--ink)",
                          textDecoration: "none",
                          fontWeight: 500,
                          fontSize: 13.5,
                        }}
                      >
                        {mp.name}
                      </Link>
                      {mp.role && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {mp.role}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {party ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <PartyDot id={mp.party as PartyId} size={8} />
                          <span
                            style={{ color: party.textColorVar, fontWeight: 600, fontSize: 12 }}
                          >
                            {party.full}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontVariantNumeric: "tabular-nums",
                        color: mp.speechCount === 0 ? "var(--muted)" : "var(--ink-2)",
                      }}
                    >
                      {mp.speechCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
