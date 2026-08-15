import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import { getEnvironment } from "./env";

export const getDiagnosticsContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Stricter RBAC: Only Super Admin, Admin or those with staff.manage can view diagnostics
    assertAccess(actor, PERMISSIONS.staffManage);

    const env = getEnvironment();
    const hostname = process.env['NODE_ENV'] === 'production' ? 'Production/SSR' : 'Development/SSR'; // Placeholder as we can't get browser hostname here easily

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.envDiagnosticsViewed,
      targetType: "system",
      metadata: {
        resolved_env: env,
        vite_app_env: import.meta.env["VITE_APP_ENV"] || "Not Set",
        masking_applied: true
      }
    });

    return { ok: true };
  });
