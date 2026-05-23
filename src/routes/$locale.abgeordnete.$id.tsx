import { createFileRoute, notFound } from "@tanstack/react-router";
import { MPProfile } from "@/components/profile/MPProfile";
import { MPS } from "@/data/mps";

export const Route = createFileRoute("/$locale/abgeordnete/$id")({
  beforeLoad: ({ params }) => {
    const mp = MPS.find((m) => m.id === params.id);
    if (!mp) throw notFound();
  },
  component: MPProfileRoute,
});

function MPProfileRoute() {
  const { id } = Route.useParams();
  return <MPProfile mpId={id} />;
}
