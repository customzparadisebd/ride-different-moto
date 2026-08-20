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
import { Moon, Sun, Clock, AlertCircle, ShieldCheck, AlertTriangle } from "lucide-react";
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
        {/* Header removed */}
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
