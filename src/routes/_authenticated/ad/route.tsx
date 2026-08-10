// ============================================================
// ADMIN PANEL GATE
// Purpose: Single entry gate for every admin screen — verifies
//          approved staff access, live session and MFA policy.
// Status: COMPLETED
// Security: The decision is made by a server function that reads
//          the verified bearer token; the client cannot fake it.
//          Hiding the URL is only an extra layer. Every underlying
//          server function re-checks permissions independently.
// Future: None.
// ============================================================
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { getMyAccess } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/ad")({
  beforeLoad: async () => {
    let access: Awaited<ReturnType<typeof getMyAccess>>;
    try {
      access = await getMyAccess({});
    } catch {
      throw redirect({ to: "/ad/denied" });
    }
    if (access.sessionRevoked) throw redirect({ to: "/ad/denied" });
    if (!access.isStaff) throw redirect({ to: "/ad/denied" });
    // MFA step-up: privileged accounts must reach AAL2 before any screen loads.
    if (access.mfaRequired && !access.mfaSatisfied) {
      throw redirect({ to: "/ad/mfa" });
    }
    return { access };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { access } = Route.useRouteContext();
  return (
    <AdminShell access={access}>
      <Outlet />
    </AdminShell>
  );
}
