import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { MethodologyModal } from "@/components/dashboard/MethodologyModal";
import { Icon } from "@/components/Icon";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import * as m from "@/paraglide/messages";
import { useUI } from "@/state/ui";

export function TopBar() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const mobileNavOpen = useUI((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen);
  const setMobileRailOpen = useUI((s) => s.setMobileRailOpen);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const isMobile = useIsMobile();
  const currentLocale = (params.locale as string | undefined) ?? "de";

  // Filter rail only makes sense on dashboard-style routes (atlas / directory pages).
  // On the landing page or detail pages we hide the filter button.
  const showFilterToggle =
    pathname.includes("/atlas") ||
    pathname.includes("/positionierung") ||
    /\/abgeordnete(\/|$)/.test(pathname) ||
    /\/sitzungen(\/|$)/.test(pathname);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };

  const switchLocale = (locale: "de" | "en") => {
    const rest = pathname.replace(/^\/(de|en)/, "");
    void navigate({ to: `/${locale}${rest}` as never, replace: true });
  };

  return (
    <>
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          padding: isMobile ? "0 12px" : "0 18px",
          background: "var(--panel)",
          borderBottom: "1px solid var(--hairline)",
          gap: isMobile ? 8 : 14,
          flex: "0 0 auto",
          position: "relative",
          zIndex: 30,
        }}
      >
        {isMobile && showFilterToggle && (
          <button
            type="button"
            onClick={() => setMobileRailOpen(true)}
            aria-label="Filter öffnen"
            style={iconButtonStyle}
          >
            <Icon name="reset" size={14} />
          </button>
        )}

        <Link
          to="/$locale"
          params={{ locale: currentLocale }}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {m.app_name()}
          </span>
          {!isMobile && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                color: "var(--muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {m.app_tagline()}
            </span>
          )}
        </Link>

        {!isMobile && (
          <button
            type="button"
            onClick={() => useUI.getState().openSearchPalette()}
            aria-label="Reden suchen"
            style={{
              flex: 1,
              maxWidth: 480,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-2)",
              border: "1px solid var(--hairline)",
              borderRadius: 6,
              padding: "0 10px",
              height: 28,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              color: "var(--ink-2)",
              textAlign: "left",
            }}
          >
            <Icon name="search" size={13} color="var(--muted)" />
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--ink-2)",
                flex: 1,
              }}
            >
              {m.app_search_example()}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--muted)",
                border: "1px solid var(--hairline)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              ⌘K
            </span>
          </button>
        )}

        <div style={{ flex: 1 }} />

        {isMobile ? (
          <>
            <button
              type="button"
              onClick={() => useUI.getState().openSearchPalette()}
              aria-label="Suche öffnen"
              style={iconButtonStyle}
            >
              <Icon name="search" size={14} />
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label={mobileNavOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobileNavOpen}
              style={iconButtonStyle}
            >
              <Icon name={mobileNavOpen ? "chev" : "expand"} size={14} />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/$locale/atlas"
              params={{ locale: currentLocale }}
              className="btn-ghost"
              activeOptions={{ exact: true }}
              style={{ textDecoration: "none" }}
            >
              Atlas
            </Link>
            <Link
              to="/$locale/abgeordnete"
              params={{ locale: currentLocale }}
              className="btn-ghost"
              activeOptions={{ exact: true }}
              style={{ textDecoration: "none" }}
            >
              Abgeordnete
            </Link>
            <Link
              to="/$locale/sitzungen"
              params={{ locale: currentLocale }}
              className="btn-ghost"
              activeOptions={{ exact: true }}
              style={{ textDecoration: "none" }}
            >
              Sitzungen
            </Link>

            <button type="button" className="btn-ghost" onClick={() => setMethodologyOpen(true)}>
              <Icon name="methodology" size={12} /> {m.topbar_methodology()}
            </button>

            <div
              style={{
                display: "flex",
                border: "1px solid var(--hairline)",
                borderRadius: 6,
                overflow: "hidden",
                height: 24,
              }}
            >
              {(["de", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLocale(l)}
                  style={{
                    padding: "0 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    fontWeight: 600,
                    background: l === currentLocale ? "var(--ink)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: l === currentLocale ? "var(--bg)" : "var(--muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <button type="button" className="btn-ghost" onClick={toggleTheme}>
              {theme === "dark" ? `☾ ${m.topbar_theme_dark()}` : `☀ ${m.topbar_theme_light()}`}
            </button>

            <button type="button" className="btn-ghost">
              <Icon name="download" size={12} /> {m.topbar_share()}
            </button>
          </>
        )}

        <MethodologyModal open={methodologyOpen} onOpenChange={setMethodologyOpen} />
      </div>

      {/* Mobile nav menu — drops down below TopBar when hamburger is open. */}
      {isMobile && mobileNavOpen && (
        <div
          style={{
            position: "fixed",
            top: 44,
            left: 0,
            right: 0,
            background: "var(--panel)",
            borderBottom: "1px solid var(--hairline)",
            padding: "8px 12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 29,
            boxShadow: "var(--shadow-md, 0 6px 16px rgba(0,0,0,0.12))",
          }}
          onClick={() => setMobileNavOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileNavOpen(false);
          }}
          role="menu"
          tabIndex={-1}
        >
          <MobileNavLink to="/$locale/atlas" locale={currentLocale} label="Atlas" />
          <MobileNavLink to="/$locale/abgeordnete" locale={currentLocale} label="Abgeordnete" />
          <MobileNavLink to="/$locale/sitzungen" locale={currentLocale} label="Sitzungen" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileNavOpen(false);
              setMethodologyOpen(true);
            }}
            style={mobileNavRowStyle}
          >
            <Icon name="methodology" size={13} /> {m.topbar_methodology()}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            style={mobileNavRowStyle}
          >
            {theme === "dark" ? `☾ ${m.topbar_theme_dark()}` : `☀ ${m.topbar_theme_light()}`}
          </button>
          <div style={{ display: "flex", gap: 6, padding: "8px 10px 0" }}>
            {(["de", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  switchLocale(l);
                  setMobileNavOpen(false);
                }}
                style={{
                  padding: "5px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  background: l === currentLocale ? "var(--ink)" : "transparent",
                  color: l === currentLocale ? "var(--bg)" : "var(--ink-2)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "1px solid var(--hairline)",
  borderRadius: 6,
  color: "var(--ink-2)",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
};

const mobileNavRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  borderRadius: 4,
  color: "var(--ink)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 500,
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
};

function MobileNavLink({
  to,
  locale,
  label,
}: {
  to: "/$locale/atlas" | "/$locale/abgeordnete" | "/$locale/sitzungen";
  locale: string;
  label: string;
}) {
  return (
    <Link to={to} params={{ locale }} style={mobileNavRowStyle}>
      {label}
    </Link>
  );
}
