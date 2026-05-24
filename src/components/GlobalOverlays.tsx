import { useEffect } from "react";
import { SpeechInspector } from "@/components/dashboard/SpeechInspector";
import { SearchPalette } from "@/components/SearchPalette";
import { useUI } from "@/state/ui";

/**
 * Mounted at the root: handles the global ⌘K shortcut and renders the
 * search palette + speech inspector overlays so they work from any route.
 */
export function GlobalOverlays() {
  const searchOpen = useUI((s) => s.searchPaletteOpen);
  const openSearch = useUI((s) => s.openSearchPalette);
  const closeSearch = useUI((s) => s.closeSearchPalette);
  const inspectedSpeechId = useUI((s) => s.inspectedSpeechId);
  const openInspector = useUI((s) => s.openSpeechInspector);
  const closeInspector = useUI((s) => s.closeSpeechInspector);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      } else if (e.key === "Escape") {
        if (searchOpen) closeSearch();
        else if (inspectedSpeechId) closeInspector();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, inspectedSpeechId, openSearch, closeSearch, closeInspector]);

  return (
    <>
      <SearchPalette
        open={searchOpen}
        onOpenChange={(open) => (open ? openSearch() : closeSearch())}
        onSelectSpeech={openInspector}
      />
      <SpeechInspector
        speechId={inspectedSpeechId}
        onOpenChange={(open) => {
          if (!open) closeInspector();
        }}
      />
    </>
  );
}
