import type { ReactNode } from "react";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";

type Props = { children: ReactNode };

/**
 * Standard PolitScope chrome: TopBar / LeftRail / BottomStrip with a
 * scrollable main area in between. Used by every non-dashboard page.
 */
export function PageShell({ children }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      <TopBar />
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <LeftRail />
        <main
          className="scroll-y"
          style={{
            flex: 1,
            overflowY: "auto",
            minWidth: 0,
            padding: "28px 36px 24px",
          }}
        >
          {children}
        </main>
      </div>
      <BottomStrip />
    </div>
  );
}
