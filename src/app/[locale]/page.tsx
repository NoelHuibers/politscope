import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
