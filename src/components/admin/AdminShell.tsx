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
import { Moon, Sun, Clock, AlertCircle, ShieldCheck } from "lucide-react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { EnvironmentBanner } from "@/components/admin/EnvironmentBanner";
import { getEnvironment } from "@/lib/env";
import { cn } from "@/lib/utils";
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
  const env = getEnvironment();

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
      <div className="flex min-h-svh w-full flex-col bg-background">
        <EnvironmentBanner />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar access={access} permissions={access.permissions} />
          <SidebarInset className="flex min-h-svh flex-col overflow-visible">
            <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wide">
                      Customer Paradise Admin Panel
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {access.email} ·{" "}
                      {access.mfaSatisfied ? "2FA verified" : "2FA not used"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-sm",
                      env === "production"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}
                  >
                    {env === "production" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {env}
                  </div>
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
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
