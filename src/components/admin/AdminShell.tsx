// ============================================================
// ADMIN SHELL (sidebar layout + session controls)
// Purpose: Chrome for the admin panel, fully separate from the
//          customer-facing store UI. Sidebar sections are filtered
//          by the signed-in role's permissions.
// Status: COMPLETED
// Security: Hidden links are convenience only — each destination
//          and every server function re-checks the permission.
//          Sign-out revokes the session server-side and clears the
//          client cache before navigating away.
// Future: None.
// ============================================================
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { recordSignOut } from "@/lib/admin.functions";
import { ROLE_LABELS, type Permission, type Role } from "@/lib/admin.shared";

export type AdminAccess = {
  email: string | null;
  primaryRole: Role | null;
  permissions: Permission[];
  isSuperAdmin: boolean;
  mfaSatisfied: boolean;
};

export function AdminShell({ access, children }: { access: AdminAccess; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar permissions={access.permissions} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide">
                  Customz Paradise BD — Operations
                </p>
                <p className="text-xs text-muted-foreground">
                  {access.email} · {access.primaryRole ? ROLE_LABELS[access.primaryRole] : "No role"}{" "}
                  · {access.mfaSatisfied ? "2FA verified" : "2FA not used"}
                </p>
              </div>
            </div>
            <Button variant="steel" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </header>
          <main className="px-4 py-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
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
