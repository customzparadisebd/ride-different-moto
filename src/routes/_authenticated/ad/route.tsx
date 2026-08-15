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
    
    // 1. MFA Verification (Identity Check)
    // Every staff user must use 2FA for account security.
    if (access.mfaRequired && !access.mfaSatisfied) {
      throw redirect({ to: "/ad/mfa" });
    }

    // 2. Staff Status Check (Permanent Account Approval)
    // Accounts in 'pending', 'suspended', etc., are blocked even if MFA is passed.
    if (!access.isStaff) {
       // If account is pending, they might need to go to the log page to see status
       if (access.status === 'pending') throw redirect({ to: "/ad/log" });
       throw redirect({ to: "/ad/denied" });
    }

    // 3. Login Approval Check (Temporary Session Validation)
    // getMyAccess already handles the redirection trigger via loginApprovalPending
    if (access.loginApprovalPending) {
       throw redirect({ to: "/ad/log" });
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
