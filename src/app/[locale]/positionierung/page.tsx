import { setRequestLocale } from "next-intl/server";
import { PositioningDetail } from "@/components/positioning/PositioningDetail";

export default async function PositioningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PositioningDetail />;
}
