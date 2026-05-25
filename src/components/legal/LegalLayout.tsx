import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";

type Props = {
  title: string;
  /** Section anchor / breadcrumb label. */
  eyebrow: string;
  /** "Stand: 25.05.2026" — short freshness marker shown under the title. */
  lastUpdated?: string;
  children: ReactNode;
  locale: string;
};

/**
 * Centred legal-document shell — clean reading column, no LeftRail/BottomStrip.
 * Use for /impressum and /datenschutz.
 */
export function LegalLayout({ title, eyebrow, lastUpdated, children, locale }: Props) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <TopBar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <article
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "56px 28px 48px",
          }}
        >
          <div
            className="t-eyebrow"
            style={{
              color: "var(--accent)",
              marginBottom: 14,
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
            }}
          >
            {eyebrow}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "clamp(32px, 4.5vw, 44px)",
              letterSpacing: "-0.018em",
              lineHeight: 1.08,
              margin: 0,
              color: "var(--ink)",
            }}
          >
            {title}
          </h1>
          {lastUpdated && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--muted)",
                marginTop: 8,
                letterSpacing: "0.04em",
              }}
            >
              {lastUpdated}
            </div>
          )}
          <div
            style={{
              marginTop: 32,
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            {children}
          </div>
        </article>
      </main>

      <footer
        style={{
          background: "var(--panel)",
          borderTop: "1px solid var(--hairline)",
          padding: "20px 28px",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--muted)",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/$locale"
            params={{ locale }}
            style={{ color: "var(--ink-2)", textDecoration: "none" }}
          >
            ← PolitScope
          </Link>
          <div style={{ display: "flex", gap: 18 }}>
            <Link
              to="/$locale/impressum"
              params={{ locale }}
              style={{ color: "var(--ink-2)", textDecoration: "none" }}
            >
              Impressum
            </Link>
            <Link
              to="/$locale/datenschutz"
              params={{ locale }}
              style={{ color: "var(--ink-2)", textDecoration: "none" }}
            >
              Datenschutz
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Styled <section> wrapper for a numbered legal block. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} style={{ marginTop: 36 }}>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "-0.008em",
          color: "var(--ink)",
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Visually distinct "needs filling in" placeholder — never ship to prod with these visible. */
export function FillIn({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        background: "color-mix(in srgb, var(--accent) 18%, transparent)",
        border: "1px dashed var(--accent)",
        borderRadius: 4,
        color: "var(--accent)",
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ margin: "0 0 12px" }}>{children}</p>;
}
