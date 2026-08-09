// ============================================================
// STAFF ACCESS & RBAC MANAGEMENT
// Purpose: Approve/suspend/revoke staff accounts, set roles and
//          assign per-user permissions.
// Purpose (security): Staff cannot approve themselves, change
//          their own role/permissions, or create a Super Admin.
// Status: COMPLETED
// Security: Every action calls a server function that re-checks the
//          caller's permission, blocks self-service changes and
//          filters the requested permissions against a server-side
//          allow-list. Role changes are Super Admin only.
// Future: None.
// ============================================================
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { adminHead } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { listStaff, setStaffPermissions, setStaffRole, setStaffStatus } from "@/lib/admin.functions";
import {
  ACCESS_STATUSES,
  ASSIGNABLE_PERMISSIONS,
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLES,
  ROLE_LABELS,
  type AccessStatus,
  type Permission,
  type Role,
} from "@/lib/admin.shared";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/staff")({
  head: () => adminHead("Staff & roles — CZP Ops"),
  component: StaffPage,
});

const statusStyles: Record<AccessStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-500",
  approved: "bg-green-500/15 text-green-500",
  suspended: "bg-orange-500/15 text-orange-500",
  revoked: "bg-destructive/15 text-destructive",
};

function StaffPage() {
  const { access } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const staff = useQuery({ queryKey: ["admin-staff"], queryFn: () => listStaff({}) });
  const canManageRoles = access.permissions.includes(PERMISSIONS.rolesManage) && access.isSuperAdmin;

  const run = async (userId: string, action: () => Promise<unknown>, message: string) => {
    setBusyId(userId);
    try {
      await action();
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That action was not allowed.");
    } finally {
      setBusyId(null);
    }
  };

  const togglePermission = (
    userId: string,
    current: Permission[],
    permission: Permission,
    on: boolean,
  ) => {
    const next = on
      ? [...new Set([...current, permission])]
      : current.filter((p) => p !== permission);
    void run(
      userId,
      () => setStaffPermissions({ data: { userId, permissions: next } }),
      "Permissions updated.",
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Staff & roles</h1>
        <p className="text-sm text-muted-foreground">
          New accounts start as <strong>Pending</strong> and cannot open the panel until approved.
        </p>
      </div>

      <div className="space-y-4">
        {(staff.data ?? []).map((member) => {
          const status = (member.access_status ?? "pending") as AccessStatus;
          const role = (member.roles[0] ?? null) as Role | null;
          const busy = busyId === member.id;
          return (
            <div key={member.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{member.full_name || member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role ? ROLE_LABELS[role] : "No role"} ·{" "}
                    {member.last_login_at
                      ? `last login ${new Date(member.last_login_at).toLocaleString()}`
                      : "never signed in"}
                    {member.mfa_required ? " · MFA required" : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>

              {member.isSelf ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  This is your own account — you cannot change your own status, role or permissions.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {ACCESS_STATUSES.filter((s) => s !== status).map((next) => (
                      <Button
                        key={next}
                        variant={next === "approved" ? "red" : "steel"}
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            member.id,
                            () => setStaffStatus({ data: { userId: member.id, status: next } }),
                            `Account ${next}.`,
                          )
                        }
                      >
                        {next === "approved"
                          ? "Approve"
                          : next === "suspended"
                            ? "Suspend"
                            : next === "revoked"
                              ? "Revoke"
                              : "Set pending"}
                      </Button>
                    ))}
                  </div>

                  {canManageRoles ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Role
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {ROLES.map((r) => (
                          <Button
                            key={r}
                            variant={r === role ? "red" : "steel"}
                            size="sm"
                            disabled={busy || r === role}
                            onClick={() =>
                              void run(
                                member.id,
                                () => setStaffRole({ data: { userId: member.id, role: r } }),
                                `Role set to ${ROLE_LABELS[r]}.`,
                              )
                            }
                          >
                            {ROLE_LABELS[r]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Extra permissions
                    </p>
                    <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                      {ASSIGNABLE_PERMISSIONS.map((permission) => {
                        const on = member.permissions.includes(permission);
                        return (
                          <label
                            key={permission}
                            className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={busy}
                              onChange={(e) =>
                                togglePermission(
                                  member.id,
                                  member.permissions,
                                  permission,
                                  e.target.checked,
                                )
                              }
                            />
                            {PERMISSION_LABELS[permission]}
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Security settings, API integrations and role management stay Super Admin only
                      and cannot be granted here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {staff.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      </div>
    </div>
  );
}