import { createFileRoute, notFound } from "@tanstack/react-router";
import { MPProfile } from "@/components/profile/MPProfile";
import { MPS } from "@/data/mps";
import { getMpByExtId, type MpProfile as MpProfileData } from "@/lib/server/directory";

export const Route = createFileRoute("/$locale/abgeordnete/$id")({
  loader: async ({ params }): Promise<{ realProfile: MpProfileData | null }> => {
    // Try DB first — URL id is treated as a Bundestag extId.
    const realProfile = await getMpByExtId({ data: params.id });
    if (realProfile) return { realProfile };

    // Fall back to mock MPs by their string id (e.g. "merz", "habeck"). Used
    // by mock-driven components like FingerprintGrid until those are wired.
    const mockMp = MPS.find((m) => m.id === params.id);
    if (!mockMp) throw notFound();
    return { realProfile: null };
  },
  component: MPProfileRoute,
});

function MPProfileRoute() {
  const { id } = Route.useParams();
  const { realProfile } = Route.useLoaderData();
  return <MPProfile mpId={id} realProfile={realProfile} />;
}
