import { createFileRoute, notFound } from "@tanstack/react-router";
import { MPProfile } from "@/components/profile/MPProfile";
import { getMpByExtId, type MpProfile as MpProfileData } from "@/lib/server/directory";

export const Route = createFileRoute("/$locale/abgeordnete/$id")({
  loader: async ({ params }): Promise<{ realProfile: MpProfileData }> => {
    const realProfile = await getMpByExtId({ data: params.id });
    if (!realProfile) throw notFound();
    return { realProfile };
  },
  component: MPProfileRoute,
});

function MPProfileRoute() {
  const { realProfile } = Route.useLoaderData();
  return <MPProfile realProfile={realProfile} />;
}
