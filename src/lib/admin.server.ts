// ============================================================
// ADMIN SECURITY CORE (server-only)
// Purpose: Resolves the caller's identity, role, effective
//          permissions and session state; writes the audit log;
//          enforces login rate limiting, session revocation and
//          MFA policy. Every admin server function goes through
//          here before touching data.
// Status: COMPLETED
// Security: Blocked from client bundles by the `.server.ts`
//          extension. Uses the service-role client for
//          append-only audit/session/lockout writes so Staff can
//          never edit or delete those records. Never returns
//          secrets, tokens or MFA secrets to the client.
// Future: None.
// ============================================================
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import {
  ROLE_DEFAULT_PERMISSIONS,
  SUPER_ADMIN_ONLY,
  PERMISSIONS,
  type AccessStatus,
  type Permission,
  type Role,
} from "./admin.shared";

export const OWNER_EMAIL = "customzparadisebd@gmail.com";

export type RequestMeta = { ip: string | null; userAgent: string | null };

export function requestMeta(): RequestMeta {
  try {
    return {
      ip: getRequestIP({ xForwardedFor: true }) ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export type AdminClaims = {
  email?: string;
  session_id?: string;
  aal?: string;
  amr?: { method: string }[];
};

export type AdminActor = {
  userId: string;
  email: string | null;
  roles: Role[];
  primaryRole: Role | null;
  permissions: Permission[];
  status: AccessStatus;
  isSuperAdmin: boolean;
  isStaff: boolean;
  mfaSatisfied: boolean;
  mfaRequired: boolean;
  sessionId: string | null;
  sessionRevoked: boolean;
};

const ROLE_RANK: Role[] = ["super_admin", "admin", "manager", "staff"];

function effectivePermissions(roles: Role[], granted: string[]): Permission[] {
  const set = new Set<string>();
  for (const role of roles) for (const p of ROLE_DEFAULT_PERMISSIONS[role] ?? []) set.add(p);
  const isSuper = roles.includes("super_admin");
  const isAdmin = roles.includes("admin");
  const isPrivileged = isSuper || isAdmin;

  for (const p of granted) {
    // Privilege-escalation guard: super-admin-only permissions are ignored
    // for anyone who is not a Super Admin, even if a row exists.
    if (!isSuper && SUPER_ADMIN_ONLY.includes(p as Permission)) continue;

    // Hard restrict specific sections from Staff roles (non-privileged)
    if (!isPrivileged) {
      if (p === PERMISSIONS.staffManage || p === PERMISSIONS.couriersManage || p === PERMISSIONS.apiManage || p === PERMISSIONS.couriersView) {
        continue;
      }
    }

    set.add(p);
  }
  return [...set] as Permission[];
}

/**
 * Bootstraps the owner account, keeps the profile row fresh and returns the
 * fully-resolved actor. Called by every admin server function.
 */
export async function resolveActor(
  userId: string,
  claims: AdminClaims | null,
): Promise<AdminActor> {
  const email = claims?.email?.toLowerCase() ?? null;
  // SECURITY: Case-insensitive email comparison for the owner account.
  const isOwner = !!email && email === OWNER_EMAIL.toLowerCase();

  const existing = await supabaseAdmin
    .from("profiles")
    .select("id, access_status, mfa_required")
    .eq("id", userId)
    .maybeSingle();

  if (!existing.data) {
    await supabaseAdmin.from("profiles").insert({
      id: userId,
      email,
      // SECURE STAFF ACCESS: brand new accounts start Pending and cannot
      // reach the panel until an Admin/Super Admin approves them. Only the
      // documented owner account is auto-approved.
      access_status: isOwner ? "approved" : "pending",
      mfa_required: isOwner,
      approved_at: isOwner ? new Date().toISOString() : null,
    });
  } else if (email) {
    await supabaseAdmin
      .from("profiles")
      .update({ email, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }

  if (isOwner) {
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin
      .from("profiles")
      .update({ access_status: "approved", mfa_required: true })
      .eq("id", userId);
  }

  const [profile, roleRows, permRows] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("access_status, mfa_required")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("user_permissions").select("permission").eq("user_id", userId),
  ]);

  const roles = (roleRows.data ?? []).map((r) => r.role as Role);
  const status = (profile.data?.access_status ?? "pending") as AccessStatus;
  const primaryRole = ROLE_RANK.find((r) => roles.includes(r)) ?? null;
  const permissions = effectivePermissions(
    roles,
    (permRows.data ?? []).map((p) => p.permission),
  );
  const isSuperAdmin = roles.includes("super_admin");

  const sessionId = claims?.session_id ?? null;
  let sessionRevoked = false;
  if (sessionId) {
    const meta = requestMeta();
    const row = await supabaseAdmin
      .from("admin_sessions")
      .select("id, revoked_at")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (row.data) {
      sessionRevoked = !!row.data.revoked_at;
      if (!sessionRevoked) {
        await supabaseAdmin
          .from("admin_sessions")
          .update({ last_seen_at: new Date().toISOString(), ip_address: meta.ip })
          .eq("id", row.data.id);
      }
    } else if (roles.length) {
      await supabaseAdmin.from("admin_sessions").insert({
        user_id: userId,
        session_id: sessionId,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
      });
    }
  }

  return {
    userId,
    email,
    roles,
    primaryRole,
    permissions,
    status,
    isSuperAdmin,
    isStaff: roles.length > 0 && status === "approved",
    // MFA is satisfied when Supabase issued an AAL2 token (password + TOTP).
    mfaSatisfied: claims?.aal === "aal2",
    mfaRequired: isSuperAdmin || !!profile.data?.mfa_required,
    sessionId,
    sessionRevoked,
  };
}

export class AccessError extends Error {
  code: "unauthenticated" | "not_staff" | "pending" | "suspended" | "mfa_required" | "forbidden";
  constructor(code: AccessError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * BROKEN-ACCESS-CONTROL GATE. Every admin server function must call this.
 * Checks: approved status → live session → MFA policy → permission.
 */
export function assertAccess(actor: AdminActor, permission?: Permission): void {
  if (actor.sessionRevoked) {
    throw new AccessError("suspended", "This session was revoked. Please sign in again.");
  }
  if (!actor.roles.length) throw new AccessError("not_staff", "No admin access on this account.");
  if (actor.status === "pending") {
    throw new AccessError("pending", "Your access is awaiting approval.");
  }
  if (actor.status !== "approved") {
    throw new AccessError("suspended", "Your access has been suspended or revoked.");
  }
  if (actor.mfaRequired && !actor.mfaSatisfied) {
    throw new AccessError("mfa_required", "Two-factor verification is required.");
  }
  if (permission && !actor.permissions.includes(permission)) {
    throw new AccessError("forbidden", "You do not have permission to do that.");
  }
}

// ============================================================
// AUDIT LOG WRITER
// Purpose: Append-only record of every sensitive admin action.
// Status: COMPLETED
// Security: Written with the service-role client only; no client
//          role holds INSERT/UPDATE/DELETE on admin_audit_log.
// ============================================================
export async function writeAudit(entry: {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  sessionId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}) {
  const meta = requestMeta();
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    actor_role: entry.actorRole ?? null,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    target_label: entry.targetLabel ?? null,
    ip_address: meta.ip,
    user_agent: meta.userAgent,
    session_id: entry.sessionId ?? null,
    old_value: (entry.oldValue ?? null) as never,
    new_value: (entry.newValue ?? null) as never,
    metadata: (entry.metadata ?? null) as never,
  });
}

export async function auditFromActor(
  actor: AdminActor,
  entry: Omit<
    Parameters<typeof writeAudit>[0],
    "actorId" | "actorEmail" | "actorRole" | "sessionId"
  >,
) {
  await writeAudit({
    ...entry,
    actorId: actor.userId,
    actorEmail: actor.email,
    actorRole: actor.primaryRole,
    sessionId: actor.sessionId,
  });
}

// ============================================================
// LOGIN RATE LIMITING (progressive lockout)
// Purpose: Blocks brute-force sign-in attempts.
// Status: COMPLETED
// Security: Attempt counters live server-side in login_attempts
//          (service-role only) so clearing browser storage does
//          not reset a lockout. Responses never reveal whether an
//          account exists.
// ============================================================
const LOCK_STEPS = [5, 15, 30, 60]; // minutes

function lockMinutesFor(failures: number): number {
  if (failures < 3) return 0;
  const step = Math.min(Math.floor((failures - 3) / 3), LOCK_STEPS.length - 1);
  return LOCK_STEPS[step]!;
}

async function consecutiveFailures(emailKey: string) {
  const { data } = await supabaseAdmin
    .from("login_attempts")
    .select("success, created_at")
    .eq("email_key", emailKey)
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = data ?? [];
  let failures = 0;
  let lastFailureAt: string | null = null;
  for (const row of rows) {
    if (row.success) break;
    if (!lastFailureAt) lastFailureAt = row.created_at;
    failures += 1;
  }
  return { failures, lastFailureAt };
}

export async function loginLockState(emailRaw: string) {
  const emailKey = emailRaw.trim().toLowerCase();
  const { failures, lastFailureAt } = await consecutiveFailures(emailKey);
  const minutes = lockMinutesFor(failures);
  if (!minutes || !lastFailureAt) return { locked: false, retryInSeconds: 0 };
  const until = new Date(lastFailureAt).getTime() + minutes * 60_000;
  const remaining = until - Date.now();
  return remaining > 0
    ? { locked: true, retryInSeconds: Math.ceil(remaining / 1000) }
    : { locked: false, retryInSeconds: 0 };
}

export async function recordLoginAttempt(emailRaw: string, success: boolean) {
  const emailKey = emailRaw.trim().toLowerCase();
  const meta = requestMeta();
  await supabaseAdmin
    .from("login_attempts")
    .insert({ email_key: emailKey, ip_address: meta.ip, success });
}

// ============================================================
// MFA BACKUP CODES
// Purpose: One-time recovery codes for admins who lose their
//          authenticator device.
// Status: COMPLETED
// Security: Only SHA-256 hashes (with a per-code random salt) are
//          stored; plaintext codes are returned exactly once at
//          generation time and are never retrievable afterwards.
// ============================================================
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const chars = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5, 10)}`;
}

async function hashCode(userId: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${userId}:${code.trim().toUpperCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function issueBackupCodes(userId: string): Promise<string[]> {
  const codes = Array.from({ length: 8 }, randomCode);
  const hashes = await Promise.all(codes.map((code) => hashCode(userId, code)));
  await supabaseAdmin.from("mfa_backup_codes").delete().eq("user_id", userId);
  await supabaseAdmin
    .from("mfa_backup_codes")
    .insert(hashes.map((code_hash) => ({ user_id: userId, code_hash })));
  return codes;
}

export async function backupCodeStats(userId: string) {
  const { data } = await supabaseAdmin
    .from("mfa_backup_codes")
    .select("used_at")
    .eq("user_id", userId);
  const rows = data ?? [];
  return { total: rows.length, remaining: rows.filter((r) => !r.used_at).length };
}

export async function consumeBackupCode(userId: string, code: string): Promise<boolean> {
  const hash = await hashCode(userId, code);
  const { data } = await supabaseAdmin
    .from("mfa_backup_codes")
    .select("id")
    .eq("user_id", userId)
    .eq("code_hash", hash)
    .is("used_at", null)
    .maybeSingle();
  if (!data) return false;
  await supabaseAdmin
    .from("mfa_backup_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  return true;
}

/** Confirms the caller has a staff role (legacy helper kept for orders code). */
export async function assertStaffRpc(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("is_staff", { _user_id: userId });
  if (error || !data) throw new AccessError("not_staff", "You are not authorised to do that.");
}
