import { useEffect, useState } from "react";

/** Mobile breakpoint (px). Matches the LeftRail off-canvas + dashboard single-column threshold. */
export const MOBILE_BREAKPOINT = 768;

/**
 * `true` when `window.innerWidth < MOBILE_BREAKPOINT`. SSR-safe: returns `false`
 * on the server and during the first client render, then flips on mount so the
 * tree hydrates consistently with the server-rendered desktop layout.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
