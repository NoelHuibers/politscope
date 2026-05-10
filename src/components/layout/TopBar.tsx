"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MethodologyModal } from "@/components/dashboard/MethodologyModal";
import { Icon } from "@/components/Icon";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useUI } from "@/state/ui";

export function TopBar() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };

  const switchLocale = (locale: "de" | "en") => {
    router.replace(pathname, { locale });
  };

  return (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        background: "var(--panel)",
        borderBottom: "1px solid var(--hairline)",
        gap: 18,
        flex: "0 0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          {t("App.name")}
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
          {t("App.tagline")}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-2)",
          border: "1px solid var(--hairline)",
          borderRadius: 6,
          padding: "0 12px",
          height: 34,
        }}
      >
        <Icon name="search" size={13} color="var(--muted)" />
        <span
          style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", flex: 1 }}
        >
          {t("App.searchExample")}
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
      </div>

      <div style={{ flex: 1 }} />

      <button type="button" className="btn-ghost" onClick={() => setMethodologyOpen(true)}>
        <Icon name="methodology" size={12} /> {t("TopBar.methodology")}
      </button>
      <MethodologyModal open={methodologyOpen} onOpenChange={setMethodologyOpen} />

      <div
        style={{
          display: "flex",
          border: "1px solid var(--hairline)",
          borderRadius: 6,
          overflow: "hidden",
          height: 28,
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
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              textTransform: "uppercase",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <button type="button" className="btn-ghost" onClick={toggleTheme}>
        {theme === "dark" ? `☾ ${t("TopBar.themeDark")}` : `☀ ${t("TopBar.themeLight")}`}
      </button>

      <button type="button" className="btn-ghost">
        <Icon name="download" size={12} /> {t("TopBar.share")}
      </button>
    </div>
  );
}
