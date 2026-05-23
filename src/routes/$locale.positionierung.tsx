import { createFileRoute } from "@tanstack/react-router";
import { PositioningDetail } from "@/components/positioning/PositioningDetail";

export const Route = createFileRoute("/$locale/positionierung")({
  component: PositioningDetail,
});
