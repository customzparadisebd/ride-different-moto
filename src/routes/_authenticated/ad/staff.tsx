import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  History,
  Trash2,
  KeyRound,
  Edit2,
  Shield,
  UserX,
  UserCheck,
  Smartphone,
  MapPin,
  Mail,
  Clock,
  User,
  MoreVertical,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { UserActivityDialog } from "@/components/admin/UserActivityDialog";
import { UserPermissionsDialog } from "@/components/admin/UserPermissionsDialog";
import { StaffAvatar } from "@/components/admin/StaffAvatar";

import {
  deleteStaff,
  listStaff,
  setStaffName,
  setStaffPassword,
  setStaffStatus,
  setStaffRole,
} from "@/lib/admin.functions";
import {
  ACCESS_STATUSES,
  PERMISSIONS,
  ROLE_LABELS,
  ACCESS_STATUS_LABELS,
  type Permission,
} from "@/lib/admin.shared";

export const Route = createFileRoute("/_authenticated/ad/staff")({
  component: StaffPage,
});

function StaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { access } = Route.useRouteContext();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);
  const [activityUserName, setActivityUserName] = useState<string>("");
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const [permissionsUserName, setPermissionsUserName] = useState<string>("");
  const [initialPermissions, setInitialPermissions] = useState<Permission[]>([]);

  const staff = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => listStaff({}),
  });

  // Security: Staff users redirected to dashboard
  useEffect(() => {
    if (access.primaryRole === "staff") {
      toast.error("Access denied: You do not have permission to manage staff.");
      void navigate({ to: "/ad" });
    }
  }, [access.primaryRole, navigate]);

  if (access.primaryRole === "staff") return null;

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

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this staff account?")) return;
    void run(userId, () => deleteStaff({ data: { userId } }), "Staff account deleted.");
  };

  const handlePasswordReset = async (userId: string) => {
    const password = window.prompt("Enter new password (min 8 characters):");
    if (!password) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    void run(userId, () => setStaffPassword({ data: { userId, password } }), "Password updated.");
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "approved" ? "suspended" : "approved";
    void run(
      userId,
      () => setStaffStatus({ data: { userId, status: nextStatus as any } }),
      `User ${nextStatus === "approved" ? "activated" : "deactivated"}.`,
    );
  };

  const handleEditName = async (userId: string, currentName: string) => {
    const name = window.prompt("Enter full name:", currentName);
    if (!name || name === currentName) return;
    void run(userId, () => setStaffName({ data: { userId, fullName: name } }), "Name updated.");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider">
            Staff & Roles
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage administrative accounts and permissions.
          </p>
        </div>

        <AddUserDialog
          onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["admin-staff"] })}
          isSuperAdmin={access.isSuperAdmin}
          callerRole={access.primaryRole as string}
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] uppercase font-bold text-xs tracking-widest py-4">
                User Information
              </TableHead>
              <TableHead className="uppercase font-bold text-xs tracking-widest">
                Role & Status
              </TableHead>
              <TableHead className="uppercase font-bold text-xs tracking-widest">
                Last Login
              </TableHead>
              <TableHead className="text-right uppercase font-bold text-xs tracking-widest">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.data?.map((member: any) => {
              const isSelf = member.id === access.userId;
              const busy = busyId === member.id;

              return (
                <TableRow key={member.id} className="group transition-colors hover:bg-muted/10">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted border border-border overflow-hidden shadow-sm">
                        <StaffAvatar avatarUrl={member.avatar_url} alt={member.full_name} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground flex items-center gap-2">
                          {member.full_name}
                          {isSelf && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 h-4 bg-muted/50 border-primary/30 text-primary uppercase"
                            >
                              You
                            </Badge>
                          )}
                        </span>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {member.email}
                          </span>
                          {member.phone_number && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Smartphone className="size-3" />
                              {member.phone_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Shield
                          className={`size-3.5 ${member.primary_role === "super_admin" ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="text-sm font-medium">
                          {ROLE_LABELS[member.primary_role as keyof typeof ROLE_LABELS]}
                        </span>
                      </div>
                      <Badge
                        className={`w-fit uppercase text-[10px] tracking-wider px-2 py-0.5 ${
                          member.access_status === "approved"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                        variant="outline"
                      >
                        {
                          ACCESS_STATUS_LABELS[
                            member.access_status as keyof typeof ACCESS_STATUS_LABELS
                          ]
                        }
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {member.last_login_at ? (
                        <>
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Clock className="size-3 text-primary" />
                            {format(new Date(member.last_login_at), "h:mm a, d MMM yyyy")}
                          </div>
                          {member.last_login_ip && (
                            <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                              <MapPin className="size-3" />
                              {member.last_login_ip}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Never logged in</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                        onClick={() => {
                          setActivityUserId(member.id);
                          setActivityUserName(member.full_name);
                        }}
                        title="View Activity"
                      >
                        <Activity className="size-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            disabled={busy} aria-label="More actions">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Management
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditName(member.id, member.full_name)}
                          >
                            <Edit2 className="mr-2 size-3.5" />
                            Edit Name
                          </DropdownMenuItem>

                          {access.isSuperAdmin && !isSelf && (
                            <DropdownMenuItem
                              onClick={() => {
                                setPermissionsUserId(member.id);
                                setPermissionsUserName(member.full_name);
                                setInitialPermissions(member.permissions || []);
                              }}
                            >
                              <Shield className="mr-2 size-3.5" />
                              Edit Permissions
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handlePasswordReset(member.id)}>
                            <KeyRound className="mr-2 size-3.5" />
                            Change Password
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleStatusToggle(member.id, member.access_status)}
                            className={
                              member.access_status === "approved"
                                ? "text-red-500 focus:text-red-500 focus:bg-red-500/5"
                                : "text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/5"
                            }
                          >
                            {member.access_status === "approved" ? (
                              <>
                                <UserX className="mr-2 size-3.5" />
                                Suspend Account
                              </>
                            ) : member.access_status === "pending" ? (
                              <>
                                <UserCheck className="mr-2 size-3.5" />
                                Approve Account
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 size-3.5" />
                                Activate Account
                              </>
                            )}
                          </DropdownMenuItem>

                          {member.access_status !== "revoked" && (
                            <DropdownMenuItem
                              onClick={() =>
                                void run(
                                  member.id,
                                  () =>
                                    setStaffStatus({
                                      data: { userId: member.id, status: "revoked" },
                                    }),
                                  "Account access revoked.",
                                )
                              }
                              className="text-red-600 focus:text-red-600 focus:bg-red-600/5"
                            >
                              <UserX className="mr-2 size-3.5" />
                              Revoke Access
                            </DropdownMenuItem>
                          )}

                          {!isSelf && access.isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id)}
                                className="text-red-600 font-bold focus:text-red-600 focus:bg-red-600/5"
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Permanently Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {staff.data?.length === 0 && !staff.isLoading && (
          <div className="py-20 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <User className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wider">No users found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try creating a new administrative user.
            </p>
          </div>
        )}

        {staff.isLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Loading users...
              </span>
            </div>
          </div>
        )}
      </div>

      <UserActivityDialog
        userId={activityUserId}
        userName={activityUserName || ""}
        open={!!activityUserId}
        onOpenChange={(open) => !open && setActivityUserId(null)}
      />

      <UserPermissionsDialog
        userId={permissionsUserId}
        userName={permissionsUserName}
        initialPermissions={initialPermissions}
        open={!!permissionsUserId}
        onOpenChange={(open) => !open && setPermissionsUserId(null)}
      />
    </div>
  );
}
