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
import { type ReactNode, useEffect, useState } from "react";
import { Moon, Sun, Clock } from "lucide-react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { recordSignOut } from "@/lib/admin.functions";
import { useTheme } from "@/lib/theme";
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
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleSignOut = async () => {
    try {
      await recordSignOut();
      await supabase.auth.signOut();
      queryClient.clear();
      void navigate({ to: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
      void navigate({ to: "/" });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full bg-background overflow-hidden">
        <AdminSidebar access={access} permissions={access.permissions} />
        <SidebarInset className="flex flex-col overflow-hidden">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide">
                  Customer Paradise Admin Panel
                </p>
                <p className="text-xs text-muted-foreground">
                  {access.email} ·{" "}
                  {access.mfaSatisfied ? "2FA verified" : "2FA not used"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium md:flex">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="tabular-nums">{formattedTime} (Dhaka)</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="steel" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
