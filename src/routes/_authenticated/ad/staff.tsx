import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Trash2, KeyRound, Edit2, Shield, UserX, UserCheck, Smartphone, MapPin, Mail, Clock } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { UserActivityDialog } from "@/components/admin/UserActivityDialog";

import {
  deleteStaff,
  listStaff,
  setStaffName,
  setStaffPassword,
  setStaffStatus,
} from "@/lib/admin.functions";
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

export const Route = createFileRoute("/_authenticated/ad/staff")({
  head: () => ({ meta: [{ title: "Staff & roles — CZP Ops" }, { property: "og:title", content: "Staff & roles — CZP Ops" }, { name: "description", content: "Customz Paradise BD Admin Panel" }] }),
  component: StaffPage,
});

const statusStyles: Record<AccessStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-500",
  approved: "bg-green-500/15 text-green-500",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-orange-500/15 text-orange-500",
  revoked: "bg-destructive/15 text-destructive",
};

function StaffPage() {
  const { access } = Route.useRouteContext();
  const navigate = useNavigate();

  // ACCESS CONTROL: Staff must have no access to the Staff & Roles section.
  // Super Admin and Admin only. Redirect staff to Dashboard.
  useEffect(() => {
    if (access.primaryRole !== "super_admin" && access.primaryRole !== "admin") {
      toast.error("Access denied: Admin only.");
      void navigate({ to: "/ad", replace: true });
    }
  }, [access.primaryRole, navigate]);

  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const staff = useQuery({ queryKey: ["admin-staff"], queryFn: () => listStaff({}) });
  const canManageRoles =
    access.permissions.includes(PERMISSIONS.rolesManage) && access.isSuperAdmin;

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

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this staff account?")) return;
    void run(userId, () => deleteStaff({ data: { userId } }), "Staff account deleted.");
  };

  const handlePasswordReset = async (userId: string) => {
    const password = window.prompt("Enter new password (min 8 characters):");
    if (!password) return;
    if (password.length < 8) {
      toast.error("Password too short.");
      return;
    }
    void run(userId, () => setStaffPassword({ data: { userId, password } }), "Password updated.");
  };

  const handleEditName = async (userId: string, currentName: string) => {
    const name = window.prompt("Enter full name:", currentName);
    if (!name || name === currentName) return;
    if (name.length < 2) {
      toast.error("Name too short.");
      return;
    }
    void run(userId, () => setStaffName({ data: { userId, fullName: name } }), "Name updated.");
  };

  const handleAddUser = async () => {
    const email = window.prompt("Enter email address:");
    if (!email) return;
    const fullName = window.prompt("Enter full name:");
    if (!fullName) return;
    const password = window.prompt("Enter initial password (min 8 characters):");
    if (!password || password.length < 8) {
      toast.error("Invalid password.");
      return;
    }

    const rolePrompt = window.prompt(
      "Enter role (super_admin, admin, manager, staff):",
      "staff",
    );
    if (!rolePrompt || !ROLES.includes(rolePrompt as Role)) {
      toast.error("Invalid role.");
      return;
    }

    void run(
      "new",
      () =>
        createStaff({
          data: {
            email,
            fullName,
            password,
            role: rolePrompt as Role,
          },
        }),
      "Staff account created.",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Staff & roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, roles, and access. Approved accounts can reach the panel.
          </p>
        </div>
        <Button variant="red" onClick={handleAddUser}>
          Add User
        </Button>
      </div>

      <div className="space-y-4">
        {(staff.data ?? []).map((member) => {
          const status = (member.access_status ?? "pending") as AccessStatus;
          const role = (member.roles[0] ?? null) as Role | null;
          const isSuperAdmin = member.roles.includes("super_admin");
          const busy = busyId === member.id;
          return (
            <div key={member.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display font-bold text-muted-foreground uppercase">
                    {(member.full_name || member.email || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {member.full_name || (isSuperAdmin ? "Super Admin" : "Staff Member")}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-primary">
                        {role ? ROLE_LABELS[role] : "No role"}
                      </span>
                      <span>·</span>
                      <span>
                        {member.last_login_at
                          ? `Login: ${new Date(member.last_login_at).toLocaleString()}`
                          : "Never logged in"}
                      </span>
                      {member.mfa_required && (
                        <>
                          <span>·</span>
                          <span className="text-green-500">MFA Required</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              {member.isSelf ? (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
                    <p className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Your Account
                    </p>
                    <Button
                      variant="steel"
                      size="sm"
                      className="h-7 text-[10px]"
                      disabled={busy}
                      onClick={() => handleEditName(member.id, member.full_name || "")}
                    >
                      Edit Name
                    </Button>
                  </div>
                  <div className="rounded bg-muted/30 p-2 text-center text-xs text-muted-foreground">
                    Logged in as this account — sensitive security changes must be done by another admin.
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
                    <p className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Access Control
                    </p>
                    {ACCESS_STATUSES.filter((s) => s !== status).map((next) => (
                      <Button
                        key={next}
                        variant={next === "approved" ? "red" : "steel"}
                        size="sm"
                        className="h-7 text-[10px]"
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

                    <Button
                      variant="steel"
                      size="sm"
                      className="h-7 text-[10px]"
                      disabled={busy}
                      onClick={() => handlePasswordReset(member.id)}
                    >
                      Reset Password
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px]"
                      disabled={busy}
                      onClick={() => handleDelete(member.id)}
                    >
                      Delete
                    </Button>
                  </div>

                  {canManageRoles ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Change Role
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ROLES.map((r) => (
                          <Button
                            key={r}
                            variant={r === role ? "red" : "steel"}
                            size="sm"
                            className="h-7 text-[10px]"
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

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Permissions
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {ASSIGNABLE_PERMISSIONS.map((permission) => {
                        const on = member.permissions.includes(permission);
                        return (
                          <label
                            key={permission}
                            className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-[11px] transition-colors ${on ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"}`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={busy}
                              className="accent-primary"
                              onChange={(e) =>
                                togglePermission(
                                  member.id,
                                  member.permissions,
                                  permission,
                                  e.target.checked,
                                )
                              }
                            />
                            <span className={on ? "font-medium text-foreground" : ""}>
                              {PERMISSION_LABELS[permission]}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {staff.data?.length === 0 && !staff.isLoading && (
          <div className="py-12 text-center text-muted-foreground">No staff members found.</div>
        )}
        {staff.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
