import { create } from "zustand";

type UIState = {
  theme: "light" | "dark";
  leftRailCollapsed: boolean;
  /** Mobile-only: LeftRail rendered as off-canvas drawer. */
  mobileRailOpen: boolean;
  /** Mobile-only: TopBar nav menu (Atlas/Abgeordnete/Sitzungen/...). */
  mobileNavOpen: boolean;
  hoveredMpId: string | null;
  hoveredWord: string | null;
  highlightTopicId: string | null;
  searchPaletteOpen: boolean;
  inspectedSpeechId: string | null;
  setTheme: (t: "light" | "dark") => void;
  toggleLeftRail: () => void;
  setLeftRailCollapsed: (collapsed: boolean) => void;
  setMobileRailOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setHoveredMp: (id: string | null) => void;
  setHoveredWord: (w: string | null) => void;
  setHighlightTopic: (id: string | null) => void;
  openSearchPalette: () => void;
  closeSearchPalette: () => void;
  openSpeechInspector: (id: string) => void;
  closeSpeechInspector: () => void;
};

export const useUI = create<UIState>((set) => ({
  theme: "dark",
  leftRailCollapsed: false,
  mobileRailOpen: false,
  mobileNavOpen: false,
  hoveredMpId: null,
  hoveredWord: null,
  highlightTopicId: null,
  searchPaletteOpen: false,
  inspectedSpeechId: null,
  setTheme: (theme) => set({ theme }),
  toggleLeftRail: () => set((s) => ({ leftRailCollapsed: !s.leftRailCollapsed })),
  setLeftRailCollapsed: (leftRailCollapsed) => set({ leftRailCollapsed }),
  setMobileRailOpen: (mobileRailOpen) => set({ mobileRailOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setHoveredMp: (hoveredMpId) => set({ hoveredMpId }),
  setHoveredWord: (hoveredWord) => set({ hoveredWord }),
  setHighlightTopic: (highlightTopicId) => set({ highlightTopicId }),
  openSearchPalette: () => set({ searchPaletteOpen: true }),
  closeSearchPalette: () => set({ searchPaletteOpen: false }),
  openSpeechInspector: (inspectedSpeechId) => set({ inspectedSpeechId, searchPaletteOpen: false }),
  closeSpeechInspector: () => set({ inspectedSpeechId: null }),
}));
