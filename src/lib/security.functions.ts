import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Validates sensitive operations and logs activity.
 * This function acts as a reusable security layer for other server functions.
 */
export const secureAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => 
    z.object({
      action: z.string(),
      targetType: z.string().optional(),
      targetId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as any);
    
    await auditFromActor(actor, {
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: data.metadata,
    });
    
    return { ok: true };
  });
