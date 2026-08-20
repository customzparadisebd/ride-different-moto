import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS, AUDIT_ACTIONS, loginApprovalActionInput } from "./admin.shared";

export const createLoginApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveActor, requestMeta } = await import("./admin.server");

    const actor = await resolveActor(context.userId, context.claims as never);
    const meta = requestMeta();

    // Admins and Super Admins don't need approval
    if (actor.isSuperAdmin || actor.primaryRole === "admin") {
      return { status: "approved" as const };
    }

    // Check for existing pending request to prevent duplicates
    const { data: existing } = await supabaseAdmin
      .from("staff_login_approvals" as any)
      .select("id, status, expires_at")
      .eq("user_id", context.userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return { requestId: (existing as any).id as string, status: "pending" as const };
    }

    const { data: request, error } = await supabaseAdmin
      .from("staff_login_approvals" as any)
      .insert({
        user_id: context.userId,
        email: actor.email || "",
        full_name: actor.fullName,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    await supabaseAdmin.from("admin_audit_log").insert({
      action: AUDIT_ACTIONS.loginApprovalCreated,
      actor_id: context.userId,
      actor_email: actor.email,
      actor_role: actor.primaryRole,
      target_type: "login_approval",
      target_id: (request as any).id as string,
      ip_address: meta.ip,
      user_agent: meta.userAgent,
    });

    return { requestId: (request as any).id as string, status: "pending" as const };
  });

export const getLoginApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: unknown) => z.string().uuid().parse(id))
  .handler(async ({ data: requestId, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("staff_login_approvals" as any)
      .select("status, expires_at")
      .eq("id", requestId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !data) return { status: "expired" as const };

    const record = data as any;
    // Handle auto-expiration
    if (record.status === "pending" && new Date(record.expires_at) < new Date()) {
      await supabaseAdmin
        .from("staff_login_approvals" as any)
        .update({ status: "expired" })
        .eq("id", requestId);
      return { status: "expired" as const };
    }

    return { status: record.status as string };
  });

export const listPendingApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.loginApprovalsManage);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("staff_login_approvals" as any)
      .select("*")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    return (data || []) as any[];
  });

export const handleApprovalAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => loginApprovalActionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.loginApprovalsManage);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = data.action === "approve" ? "approved" : "rejected";

    const { data: request, error } = await supabaseAdmin
      .from("staff_login_approvals" as any)
      .update({
        status,
        [data.action === "approve" ? "approved_at" : "rejected_at"]: new Date().toISOString(),
        [data.action === "approve" ? "approved_by" : "rejected_by"]: context.userId,
      })
      .eq("id", data.requestId)
      .select("user_id, email")
      .single();

    if (error) throw error;

    await auditFromActor(actor, {
      action:
        data.action === "approve"
          ? AUDIT_ACTIONS.loginApprovalApproved
          : AUDIT_ACTIONS.loginApprovalRejected,
      targetType: "login_approval",
      targetId: data.requestId,
      targetLabel: (request as any).email as string,
      newValue: { status },
    });

    return { ok: true };
  });
