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
import {
  Moon,
  Sun,
  Clock,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { EnvironmentBanner } from "@/components/admin/EnvironmentBanner";
import { StaffAvatar } from "@/components/admin/StaffAvatar";
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
  fullName: string | null;
  avatarUrl: string | null;
  gender: string | null;
};

export function AdminShell({ access, children }: { access: AdminAccess; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const env = getEnvironment();

  useEffect(() => {
    // Real-time listener for invoice collisions
    const collisionChannel = supabase
      .channel("invoice-collisions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "invoice_collisions" },
        (payload) => {
          const data = payload.new;
          toast.error("DUPLICATE INVOICE DETECTED", {
            description: `Attempted Invoice: ${data['invoice_no']}. Check collision logs immediately.`,
            duration: 10000,
            icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
          });
          queryClient.invalidateQueries({ queryKey: ["security-stats"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(collisionChannel);
    };
  }, [queryClient]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("en-US", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedClock = time.toLocaleTimeString("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-5 md:gap-4 md:px-6">
          <AdminHeaderToggle />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <h1 className="truncate font-display text-[11px] font-bold uppercase tracking-[0.18em] text-foreground sm:text-xs md:text-sm md:tracking-[0.2em]">
              Customer Paradise <span className="text-primary">Admin Panel</span>
            </h1>
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              {/* Admin identity */}
              <div className="hidden items-center gap-2.5 sm:flex">
                <StaffAvatar
                  avatarUrl={access.avatarUrl}
                  fallbackSeed={access.email}
                  className="h-7 w-7 rounded-full ring-1 ring-border"
                />
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[180px] truncate text-xs font-medium text-foreground/80">
                      {access.email}
                    </span>
                    {access.mfaSatisfied && (
                      <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {access.primaryRole ? ROLE_LABELS[access.primaryRole] : "Staff"}
                  </span>
                </div>
              </div>

              <span className="hidden h-7 w-px bg-border/60 lg:block" aria-hidden="true" />

              {/* Dhaka clock */}
              <div className="hidden items-center gap-1.5 lg:flex">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {formattedDate}
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-foreground/90">
                    {formattedClock}
                    <span className="ml-1 font-normal text-muted-foreground">· Dhaka</span>
                  </div>
                </div>
              </div>

              <span className="hidden h-7 w-px bg-border/60 sm:block" aria-hidden="true" />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <span className="hidden h-7 w-px bg-border/60 sm:block" aria-hidden="true" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 rounded-md border-border/70 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar access={access} permissions={access.permissions} />
          <SidebarInset className="flex min-h-svh flex-col overflow-visible">
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
