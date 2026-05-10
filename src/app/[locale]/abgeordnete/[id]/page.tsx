import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { MPProfile } from "@/components/profile/MPProfile";
import { MPS } from "@/data/mps";

export function generateStaticParams() {
  return MPS.map((m) => ({ id: m.id }));
}

export default async function MPProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const mp = MPS.find((m) => m.id === id);
  if (!mp) notFound();

  return (
    <Suspense>
      <MPProfile mpId={id} />
    </Suspense>
  );
}
