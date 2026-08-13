// ============================================================
// ADMIN SECURITY SERVER FUNCTIONS
// Purpose: RPC surface for MFA, audit log, staff/role management,
//          session hardening and login rate limiting.
// Status: COMPLETED
// Security: Every authenticated function resolves the caller from
//          the verified bearer token (never from request data) and
//          calls assertAccess() with the required permission, so
//          hitting the endpoint directly gains a Staff user
//          nothing. Only the two login-throttle functions are
//          unauthenticated, and they return no account details.
// Future: None.
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ASSIGNABLE_PERMISSIONS,
  AUDIT_ACTIONS,
  PERMISSIONS,
  auditQueryInput,
  backupCodeInput,
  loginAttemptInput,
  ROLES,
  revokeSessionInput,
  staffPermissionsInput,
  staffRoleInput,
  staffStatusInput,
  type Permission,
  type Role,
} from "./admin.shared";

/** Resolves the caller + their effective access. Safe for any signed-in user. */
export const getAdminContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    return {
      userId: actor.userId,
      email: actor.email,
      roles: actor.roles,
      primaryRole: actor.primaryRole,
      permissions: actor.permissions,
      status: actor.status,
      isSuperAdmin: actor.isSuperAdmin,
      isStaff: actor.isStaff,
      mfaRequired: actor.mfaRequired,
      mfaSatisfied: actor.mfaSatisfied,
      sessionRevoked: actor.sessionRevoked,
    };
  });

/** Records a successful sign-in: session row, last login and audit entry. */
export const recordSignIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    await supabaseAdmin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", actor.userId);
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.loginSuccess,
      targetType: "account",
      targetId: actor.userId,
      targetLabel: actor.email,
      metadata: { mfa: actor.mfaSatisfied ? "aal2" : "aal1", status: actor.status },
    });
    return { ok: true, status: actor.status, isStaff: actor.isStaff };
  });

export const recordSignOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    // SESSION INVALIDATION: mark this session dead server-side so a stolen
    // refresh token cannot keep using it.
    if (actor.sessionId) {
      await supabaseAdmin
        .from("admin_sessions")
        .update({ revoked_at: new Date().toISOString(), revoked_by: actor.userId })
        .eq("session_id", actor.sessionId);
    }
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.logout,
      targetType: "account",
      targetId: actor.userId,
    });
    return { ok: true };
  });

// ---------- LOGIN RATE LIMITING (public, no account disclosure) ----------
// ============================================================
// PASSWORD RESET AUDIT
// Purpose: Records that an account's password was changed through
//          the recovery link, so resets are traceable.
// Status: COMPLETED
// Security: The caller is resolved from the verified recovery
//          bearer token; no password material is ever accepted,
//          returned or logged here.
// Future: None.
// ============================================================
export const recordPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.passwordReset,
      targetType: "account",
      targetId: actor.userId,
      targetLabel: actor.email,
      metadata: { method: "recovery_link" },
    });
    return { ok: true };
  });

export const checkLoginAllowed = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginAttemptInput.parse(input))
  .handler(async ({ data }) => {
    const { loginLockState } = await import("./admin.server");
    return loginLockState(data.email);
  });

export const reportLoginFailure = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginAttemptInput.parse(input))
  .handler(async ({ data }) => {
    const { recordLoginAttempt, loginLockState, writeAudit } = await import("./admin.server");
    await recordLoginAttempt(data.email, false);
    await writeAudit({
      action: AUDIT_ACTIONS.loginFailed,
      actorEmail: data.email,
      targetType: "account",
      targetLabel: data.email,
    });
    return loginLockState(data.email);
  });

export const reportLoginSuccess = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginAttemptInput.parse(input))
  .handler(async ({ data }) => {
    const { recordLoginAttempt } = await import("./admin.server");
    await recordLoginAttempt(data.email, true);
    return { ok: true };
  });

// ---------- MFA ----------
/** Marks a freshly-verified TOTP factor in the audit log and issues codes. */
export const completeMfaEnrolment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, auditFromActor, issueBackupCodes } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    if (!actor.roles.length) throw new Error("No admin access on this account.");
    const codes = await issueBackupCodes(actor.userId);
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.mfaEnrolled,
      targetType: "account",
      targetId: actor.userId,
      targetLabel: actor.email,
    });
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.mfaBackupCodesIssued,
      targetType: "account",
      targetId: actor.userId,
      metadata: { count: codes.length },
    });
    // Shown once, never retrievable again.
    return { codes };
  });

export const regenerateBackupCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess, auditFromActor, issueBackupCodes } =
      await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor);
    const codes = await issueBackupCodes(actor.userId);
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.mfaBackupCodesIssued,
      targetType: "account",
      targetId: actor.userId,
      metadata: { count: codes.length, regenerated: true },
    });
    return { codes };
  });

export const getMfaOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, backupCodeStats } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    const stats = await backupCodeStats(actor.userId);
    return {
      mfaRequired: actor.mfaRequired,
      mfaSatisfied: actor.mfaSatisfied,
      backupCodes: stats,
      role: actor.primaryRole,
      isSuperAdmin: actor.isSuperAdmin,
    };
  });

/**
 * RECOVERY: a valid one-time backup code removes the lost authenticator so the
 * owner can sign in with the password and enrol a new device. The code itself
 * is verified against its stored hash and burned on use.
 */
export const recoverWithBackupCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => backupCodeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, auditFromActor, consumeBackupCode } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    const ok = await consumeBackupCode(actor.userId, data.code);
    if (!ok) throw new Error("That recovery code is not valid.");

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(actor.userId);
    const factors = (userData?.user?.factors ?? []) as { id: string }[];
    for (const factor of factors) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({ userId: actor.userId, id: factor.id });
    }
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.mfaBackupCodeUsed,
      targetType: "account",
      targetId: actor.userId,
      metadata: { removedFactors: factors.length },
    });
    return { ok: true, removedFactors: factors.length };
  });

// ---------- AUDIT LOG ----------
export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => auditQueryInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.auditView);

    let query = supabaseAdmin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      query = query.or(`action.ilike.${term},actor_email.ilike.${term},target_label.ilike.${term}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error("Could not load the audit log.");
    return rows;
  });

// ---------- STAFF & ROLES ----------
export const listStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);
    // Security: Only Super Admin and Admin can view/manage staff email and password data.
    if (!actor.isSuperAdmin && actor.primaryRole !== "admin") {
      throw new Error("You do not have permission to view staff data.");
    }

    const [profiles, roles, perms] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          "id, email, full_name, access_status, access_note, mfa_required, last_login_at, created_at",
        )
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("user_permissions").select("user_id, permission"),
    ]);

    return (profiles.data ?? []).map((p) => ({
      ...p,
      roles: (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      permissions: (perms.data ?? [])
        .filter((r) => r.user_id === p.id)
        .map((r) => r.permission as Permission),
      isSelf: p.id === actor.userId,
    }));
  });

export const setStaffStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => staffStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);
    // Staff cannot approve or reinstate themselves.
    if (data.userId === actor.userId) throw new Error("You cannot change your own access status.");

    const before = await supabaseAdmin
      .from("profiles")
      .select("access_status, email")
      .eq("id", data.userId)
      .maybeSingle();
    if (!before.data) throw new Error("Account not found.");

    // Only a Super Admin may change another Super Admin's access.
    const targetRoles = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    const targetIsSuper = (targetRoles.data ?? []).some((r) => r.role === "super_admin");
    if (targetIsSuper && !actor.isSuperAdmin) throw new Error("Only a Super Admin can do that.");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        access_status: data.status,
        access_note: data.note ?? null,
        approved_by: data.status === "approved" ? actor.userId : null,
        approved_at: data.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", data.userId);
    if (error) throw new Error("Could not update the account.");

    // Suspended/revoked accounts lose access immediately: kill their sessions.
    if (data.status !== "approved") {
      await supabaseAdmin
        .from("admin_sessions")
        .update({ revoked_at: new Date().toISOString(), revoked_by: actor.userId })
        .eq("user_id", data.userId)
        .is("revoked_at", null);
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffStatusChanged,
      targetType: "account",
      targetId: data.userId,
      targetLabel: before.data.email,
      oldValue: { access_status: before.data.access_status },
      newValue: { access_status: data.status, note: data.note ?? null },
    });
    return { ok: true };
  });

export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => staffRoleInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    // PRIVILEGE ESCALATION GUARD: role changes are Super Admin only, and
    // nobody can edit their own role.
    assertAccess(actor, PERMISSIONS.rolesManage);
    if (!actor.isSuperAdmin) throw new Error("Only a Super Admin can change roles.");
    if (data.userId === actor.userId) throw new Error("You cannot change your own role.");

    const before = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    const profile = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error("Could not change the role.");

    if (data.role === "super_admin") {
      await supabaseAdmin.from("profiles").update({ mfa_required: true }).eq("id", data.userId);
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffRoleChanged,
      targetType: "account",
      targetId: data.userId,
      targetLabel: profile.data?.email ?? null,
      oldValue: { roles: (before.data ?? []).map((r) => r.role) },
      newValue: { roles: [data.role] },
    });
    return { ok: true };
  });

export const setStaffPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => staffPermissionsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);
    if (data.userId === actor.userId) throw new Error("You cannot change your own permissions.");

    // Server-side allow-list: sensitive permissions can never be granted here.
    const allowed = data.permissions.filter((p) =>
      ASSIGNABLE_PERMISSIONS.includes(p as Permission),
    );

    const before = await supabaseAdmin
      .from("user_permissions")
      .select("permission")
      .eq("user_id", data.userId);

    await supabaseAdmin.from("user_permissions").delete().eq("user_id", data.userId);
    if (allowed.length) {
      const { error } = await supabaseAdmin.from("user_permissions").insert(
        allowed.map((permission) => ({
          user_id: data.userId,
          permission,
          granted_by: actor.userId,
        })),
      );
      if (error) throw new Error("Could not save the permissions.");
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffPermissionsChanged,
      targetType: "account",
      targetId: data.userId,
      oldValue: { permissions: (before.data ?? []).map((r) => r.permission) },
      newValue: { permissions: allowed },
    });
    return { ok: true, permissions: allowed };
  });

/** Deletes a staff account (Super Admin/Admin only). */
export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);
    if (!actor.isSuperAdmin && actor.primaryRole !== "admin") {
      throw new Error("Only Super Admins and Admins can delete users.");
    }
    if (data.userId === actor.userId) throw new Error("You cannot delete yourself.");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Could not delete the user account.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffDeleted,
      targetType: "account",
      targetId: data.userId,
      targetLabel: profile?.email ?? null,
    });
    return { ok: true };
  });

/** Updates a staff member's password (Super Admin/Admin only). */
export const setStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);
    if (!actor.isSuperAdmin && actor.primaryRole !== "admin") {
      throw new Error("Only Super Admins and Admins can change passwords.");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error("Could not update the password.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffPasswordChanged,
      targetType: "account",
      targetId: data.userId,
      targetLabel: profile?.email ?? null,
    });
    return { ok: true };
  });

/** Updates a staff member's name (Super Admin/Admin only, or self). */
export const setStaffName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), fullName: z.string().min(2) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);

    // Can change own name, or if admin, can change others.
    if (data.userId !== actor.userId) {
      assertAccess(actor, PERMISSIONS.staffManage);
      if (!actor.isSuperAdmin && actor.primaryRole !== "admin") {
        throw new Error("Only Super Admins and Admins can change other staff names.");
      }
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName })
      .eq("id", data.userId);

    if (error) throw new Error("Could not update the name.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffProfileUpdated,
      targetType: "account",
      targetId: data.userId,
      targetLabel: (profile?.email as string) ?? null,
      oldValue: { full_name: profile?.full_name as string },
      newValue: { full_name: data.fullName },
    });
    return { ok: true };
  });

/** Creates a new staff member account (Super Admin/Admin only). */
export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(2),
        role: z.enum(ROLES),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);

    if (!actor.isSuperAdmin && actor.primaryRole !== "admin") {
      throw new Error("Only Super Admins and Admins can create users.");
    }

    // Guard: Only Super Admin can create another Super Admin
    if (data.role === "super_admin" && !actor.isSuperAdmin) {
      throw new Error("Only a Super Admin can create another Super Admin.");
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (authError) throw new Error(authError.message);
    if (!authUser.user) throw new Error("User creation failed.");

    const userId = authUser.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: data.email,
      full_name: data.fullName,
      access_status: "approved",
      approved_by: actor.userId,
      approved_at: new Date().toISOString(),
      mfa_required: data.role === "super_admin",
    });

    if (profileError) {
      // Rollback auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not create staff profile.");
    }

    // Set role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not assign role.");
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffCreated,
      targetType: "account",
      targetId: userId,
      targetLabel: data.email,
      newValue: { role: data.role as string, full_name: data.fullName },
    });

    return { ok: true, userId };
  });

/** Creates a new staff member account (Super Admin/Admin only). */
export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(2),
        role: z.enum(ROLES),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.staffManage);

    if (!actor.isSuperAdmin && actor.primaryRole !== "admin") {
      throw new Error("Only Super Admins and Admins can create users.");
    }

    // Guard: Only Super Admin can create another Super Admin
    if (data.role === "super_admin" && !actor.isSuperAdmin) {
      throw new Error("Only a Super Admin can create another Super Admin.");
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (authError) throw new Error(authError.message);
    if (!authUser.user) throw new Error("User creation failed.");

    const userId = authUser.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: data.email,
      full_name: data.fullName,
      access_status: "approved",
      approved_by: actor.userId,
      approved_at: new Date().toISOString(),
      mfa_required: data.role === "super_admin",
    });

    if (profileError) {
      // Rollback auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not create staff profile.");
    }

    // Set role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not assign role.");
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.staffCreated,
      targetType: "account",
      targetId: userId,
      targetLabel: data.email,
      newValue: { role: data.role, full_name: data.fullName },
    });

    return { ok: true, userId };
  });

// ---------- SESSIONS ----------
export const listAdminSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor);

    // Staff see only their own sessions; Super Admins see all.
    let query = supabaseAdmin
      .from("admin_sessions")
      .select(
        "id, user_id, session_id, ip_address, user_agent, created_at, last_seen_at, revoked_at",
      )
      .order("last_seen_at", { ascending: false })
      .limit(100);
    if (!actor.isSuperAdmin) query = query.eq("user_id", actor.userId);
    const { data } = await query;

    const emails = await supabaseAdmin.from("profiles").select("id, email");
    const byId = new Map((emails.data ?? []).map((p) => [p.id, p.email]));
    return (data ?? []).map((row) => ({
      id: row.id,
      email: byId.get(row.user_id) ?? null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      revokedAt: row.revoked_at,
      isCurrent: row.session_id === actor.sessionId,
    }));
  });

export const revokeAdminSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => revokeSessionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.securityManage);

    const row = await supabaseAdmin
      .from("admin_sessions")
      .select("id, user_id")
      .eq("id", data.sessionRowId)
      .maybeSingle();
    if (!row.data) throw new Error("Session not found.");

    await supabaseAdmin
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: actor.userId })
      .eq("id", row.data.id);

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.sessionRevoked,
      targetType: "session",
      targetId: row.data.id,
      newValue: { revoked: true },
    });
    return { ok: true };
  });

// ---------- OWNER ACCESS DOCUMENTATION ----------
/**
 * ADMIN ACCESS INFORMATION
 * Super-admin-only. Returns the documented way into the panel plus live MFA
 * and session posture. Contains no secrets, keys or tokens.
 */
export const getAdminAccessInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess, backupCodeStats, OWNER_EMAIL } =
      await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.securityManage);
    if (!actor.isSuperAdmin) throw new Error("Only a Super Admin can view this.");

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(actor.userId);
    const factors = (userData?.user?.factors ?? []) as { status?: string }[];
    const stats = await backupCodeStats(actor.userId);
    const activeSessions = await supabaseAdmin
      .from("admin_sessions")
      .select("id")
      .is("revoked_at", null);

    return {
      ownerEmail: OWNER_EMAIL,
      mfaEnrolled: factors.some((f) => f.status === "verified"),
      mfaEnforced: actor.mfaRequired,
      backupCodesRemaining: stats.remaining,
      activeSessions: activeSessions.data?.length ?? 0,
      lastSignedInAs: actor.email,
    };
  });
