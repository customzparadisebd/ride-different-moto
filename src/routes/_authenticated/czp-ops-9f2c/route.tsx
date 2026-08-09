import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getMyAccess } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c")({
  // Server-side authorization: the server fn validates the bearer token and
  // resolves staff roles from the database. URL obscurity is not the gate.
  beforeLoad: async () => {
    try {
      const access = await getMyAccess({ data: {} });
      if (!access.isStaff) throw redirect({ to: "/czp-ops-9f2c/access-denied" });
      return { access };
    } catch (error) {
      if (error && typeof error === "object" && "to" in error) throw error;
      throw redirect({ to: "/czp-ops-9f2c/access-denied" });
    }
  },
  component: () => <Outlet />,
});
