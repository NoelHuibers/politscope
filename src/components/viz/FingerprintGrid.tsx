"use client";

import { useMemo } from "react";
import { type MP, MPS } from "@/data/mps";
import { PARTY } from "@/data/parties";
import { Link } from "@/i18n/navigation";

type Props = {
  width?: number;
  height?: number;
  dark?: boolean;
  mps?: readonly MP[];
};

const FEATURES = [
  "Satzlänge",
  "Lex. Reichtum",
  "Sentiment",
  "Formalität",
  "Partei-Abweichung",
] as const;

const PERIODS_QUARTERS = 16;

const PALETTE = [
  "var(--color-seq-1)",
  "var(--color-seq-2)",
  "var(--color-seq-3)",
  "var(--color-seq-4)",
  "var(--accent)",
];

export function FingerprintGrid({ width = 660, mps }: Props) {
  const list = mps ?? MPS.filter((m) => m.note !== "thin").slice(0, 8);
  const tile = { w: width / 4 - 8, h: 76 };

  const data = useMemo(() => {
    const out: Record<string, number[][]> = {};
    list.forEach((m, mi) => {
      out[m.id] = FEATURES.map((_, fi) => {
        const arr: number[] = [];
        let v = 0.5;
        for (let i = 0; i < PERIODS_QUARTERS; i++) {
          const seed = (mi * 17 + fi * 31 + i * 7) % 233;
          v = Math.max(0.05, Math.min(0.95, v + ((seed % 100) / 100 - 0.5) * 0.18));
          arr.push(v);
        }
        return arr;
      });
    });
    return out;
  }, [list]);

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
      }}
    >
      {list.map((m) => {
        const party = PARTY[m.party];
        const rows = data[m.id] ?? [];
        return (
          <Link
            key={m.id}
            href={`/abgeordnete/${m.id}`}
            style={{
              background: "var(--panel-2)",
              borderRadius: 4,
              padding: "8px 9px 10px",
              border: "1px solid var(--hairline)",
              display: "block",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              transition: "border-color 120ms ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: party.shape === "square" ? 1 : "50%",
                  background: party.colorVar,
                  border: m.party === "cdu" ? `1px solid ${party.ringVar ?? "transparent"}` : "0",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {m.name}
              </span>
            </div>
            <svg
              width="100%"
              height={tile.h}
              viewBox={`0 0 ${tile.w} ${tile.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {FEATURES.map((_, fi) => {
                const rowH = tile.h / FEATURES.length;
                const cellW = tile.w / PERIODS_QUARTERS;
                const row = rows[fi] ?? [];
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: feature index is stable
                  <g key={fi}>
                    {row.map((v, i) => (
                      <rect
                        // biome-ignore lint/suspicious/noArrayIndexKey: quarter index is stable
                        key={i}
                        x={i * cellW}
                        y={fi * rowH}
                        width={cellW - 0.4}
                        height={rowH - 0.6}
                        fill={PALETTE[fi % PALETTE.length]}
                        opacity={0.18 + v * 0.78}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                marginTop: 4,
              }}
            >
              {FEATURES.map((f, i) => (
                <div
                  key={f}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8.5,
                    color: "var(--muted)",
                    letterSpacing: "0.02em",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{f}</span>
                  <span>{i === FEATURES.length - 1 ? "Q1 90 → Q1 26" : ""}</span>
                </div>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
