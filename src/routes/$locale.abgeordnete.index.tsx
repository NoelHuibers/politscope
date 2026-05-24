import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PartyDot } from "@/components/PartyDot";
import { PARTY, type PartyId } from "@/data/parties";
import { getAllMps } from "@/lib/server/directory";

export const Route = createFileRoute("/$locale/abgeordnete/")({
  component: MpDirectory,
});

type SortKey = "name" | "party" | "speeches";

function MpDirectory() {
  const { locale } = Route.useParams();
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
                        <span style={{ color: party.colorVar, fontWeight: 600, fontSize: 12 }}>
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
    </PageShell>
  );
}
