// ============================================================
// ADMIN SHELL (navigation + session controls)
// Purpose: Chrome for the admin panel, fully separate from the
//          customer-facing store UI. Shows only the sections the
//          signed-in role is permitted to use.
// Status: COMPLETED
// Security: Hidden links are convenience only — each destination
//          and every server function re-checks the permission.
//          Sign-out revokes the session server-side and clears the
//          client cache before navigating away.
// Future: None.
// ============================================================
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { recordSignOut } from "@/lib/admin.functions";
import { PERMISSIONS, ROLE_LABELS, type Permission, type Role } from "@/lib/admin.shared";

export type AdminAccess = {
  email: string | null;
  primaryRole: Role | null;
  permissions: Permission[];
  isSuperAdmin: boolean;
  mfaSatisfied: boolean;
};

export function AdminShell({
  access,
  children,
}: {
  access: AdminAccess;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const can = (permission: Permission) => access.permissions.includes(permission);

  const handleSignOut = async () => {
    try {
      await recordSignOut({});
    } catch {
      /* audit/session cleanup is best-effort; sign-out must still happen */
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/czp-ops-9f2c/access", replace: true });
  };

  const navItems: { to: string; label: string; show: boolean }[] = [
    { to: "/czp-ops-9f2c", label: "Orders", show: can(PERMISSIONS.ordersView) },
    { to: "/czp-ops-9f2c/staff", label: "Staff & roles", show: can(PERMISSIONS.staffManage) },
    { to: "/czp-ops-9f2c/audit-log", label: "Audit log", show: can(PERMISSIONS.auditView) },
    { to: "/czp-ops-9f2c/security", label: "Security", show: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-wide">CZP Ops</p>
            <p className="text-xs text-muted-foreground">
              {access.email} ·{" "}
              {access.primaryRole ? ROLE_LABELS[access.primaryRole] : "No role"} ·{" "}
              {access.mfaSatisfied ? "2FA verified" : "2FA not used"}
            </p>
          </div>
          <Button variant="steel" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/czp-ops-9f2c" }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export const adminHead = (title: string) => ({
  meta: [
    { title },
    { name: "description", content: "Restricted staff area." },
    { property: "og:title", content: title },
    { property: "og:description", content: "Restricted staff area." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    // Admin screens must never be indexed.
    { name: "robots", content: "noindex, nofollow, noarchive" },
  ],
});