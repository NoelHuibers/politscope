import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolitScope — Bundestag",
  description:
    "Reden im Deutschen Bundestag (1990 → heute) im semantischen Raum. Themen-Sankey, Sprecher-Positionierung, Wortvergleich.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
