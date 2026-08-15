import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import { getEnvironment } from "./env";

export const getDiagnosticsContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Explicitly import server-only logic inside the handler
    const { resolveActor, assertAccess, auditFromActor, requestMeta } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const actor = await resolveActor(context.userId, context.claims as never);
    const meta = requestMeta();

    // 1. RBAC Check: Only Staff with staffManage permission (Super Admin/Admin by default)
    assertAccess(actor, PERMISSIONS.staffManage);

    // 2. Rate Limiting: Max 10 attempts per hour per User/IP
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("admin_audit_log")
      .select("*", { count: "exact", head: true })
      .eq("actor_id", actor.userId)
      .eq("action", AUDIT_ACTIONS.envDiagnosticsViewed)
      .gte("created_at", oneHourAgo);

    if (count && count >= 10) {
      // Log bot/abuse attempt
      await supabaseAdmin.from("security_events").insert({
        event_type: "api_throttle",
        actor_email: actor.email,
        ip_address: meta.ip,
        route: "/ad/diagnostics",
        metadata: {
          action: AUDIT_ACTIONS.envDiagnosticsViewed,
          threshold: 10,
          period: "1h",
          actor_id: actor.userId,
        } as any,
      });
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const env = getEnvironment();

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.envDiagnosticsViewed,
      targetType: "system",
      metadata: {
        resolved_env: env,
        vite_app_env: import.meta.env["VITE_APP_ENV"] || "Not Set",
        masking_applied: true,
        ip: meta.ip,
      },
    });

    return { ok: true };
  });
