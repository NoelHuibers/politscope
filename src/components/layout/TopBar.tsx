import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { MethodologyModal } from "@/components/dashboard/MethodologyModal";
import { Icon } from "@/components/Icon";
import * as m from "@/paraglide/messages";
import { useUI } from "@/state/ui";

export function TopBar() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const currentLocale = (params.locale as string | undefined) ?? "de";

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
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        background: "var(--panel)",
        borderBottom: "1px solid var(--hairline)",
        gap: 14,
        flex: "0 0 auto",
      }}
    >
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
      </Link>

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
          style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", flex: 1 }}
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

      <div style={{ flex: 1 }} />

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
      <MethodologyModal open={methodologyOpen} onOpenChange={setMethodologyOpen} />

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
    </div>
  );
}
