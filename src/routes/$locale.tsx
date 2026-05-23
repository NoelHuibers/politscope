import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { locales } from "@/paraglide/runtime";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!locales.includes(params.locale as never)) {
      throw redirect({ to: "/$locale", params: { locale: "de" } });
    }
  },
  component: () => <Outlet />,
});
