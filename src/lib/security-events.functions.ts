import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PERMISSIONS } from "./admin.shared";

const securityEventFilterInput = z.object({
  search: z.string().optional(),
  type: z.enum(["rate_limit", "login_throttle", "auth_failure", "csp_violation", "cors_violation", "suspicious_activity", "all"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listSecurityEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => securityEventFilterInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // Only super admins or those with security.manage permission
    assertAccess(actor, PERMISSIONS.securityManage);

    let query = context.supabase
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);

    if (data.type && data.type !== "all") {
      query = query.eq("event_type", data.type);
    }

    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      query = query.or(`ip_address.ilike.${term},actor_email.ilike.${term},route.ilike.${term}`);
    }

    if (data.dateFrom) {
      query = query.gte("created_at", `${data.dateFrom}T00:00:00Z`);
    }

    if (data.dateTo) {
      query = query.lte("created_at", `${data.dateTo}T23:59:59Z`);
    }

    const { data: events, error } = await query;
    if (error) throw new Error("Could not load security events.");
    
    return events;
  });
