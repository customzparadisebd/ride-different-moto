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

export const getSecurityStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.securityManage);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [eventsResult, loginAttemptsResult] = await Promise.all([
      context.supabase
        .from("security_events")
        .select("event_type, created_at, ip_address")
        .gte("created_at", twentyFourHoursAgo),
      context.supabase
        .from("login_attempts")
        .select("success, created_at")
        .gte("created_at", twentyFourHoursAgo)
    ]);

    const eventsData = eventsResult.data ?? [];
    const loginAttemptsData = loginAttemptsResult.data ?? [];

    const stats = {
      authFailures: loginAttemptsData.filter(a => !a.success).length,
      rateLimits: eventsData.filter(e => e.event_type === "rate_limit").length,
      suspiciousIPs: new Set(eventsData.map(e => e.ip_address).filter((ip): ip is string => !!ip)).size,
      totalEvents: eventsData.length,
      timeline: [] as { time: string; count: number }[]
    };

    // Build timeline (hourly for last 24h)
    const hourlyData: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = d.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[key] = 0;
    }

    eventsData.forEach(e => {
      if (!e.created_at) return;
      const d = new Date(e.created_at);
      const key = d.getHours().toString().padStart(2, '0') + ':00';
      if (hourlyData[key] !== undefined) hourlyData[key]++;
    });

    stats.timeline = Object.entries(hourlyData)
      .map(([time, count]) => ({ time, count }))
      .reverse();

    return stats;
  });

export const getSuspiciousIPs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.securityManage);

    // Instead of RPC which might not exist, we fetch recent events and aggregate
    const { data: events } = await context.supabase
        .from("security_events")
        .select("ip_address, event_type")
        .limit(1000);
    
    const eventsData = events ?? [];
    const counts: Record<string, { ip: string, failures: number, limits: number }> = {};
    eventsData.forEach(e => {
        if (!e.ip_address || !e.event_type) return;
        if (!counts[e.ip_address]) counts[e.ip_address] = { ip: e.ip_address, failures: 0, limits: 0 };
        if (e.event_type === 'login_throttle') counts[e.ip_address].failures++;
        if (e.event_type === 'rate_limit') counts[e.ip_address].limits++;
    });

    return Object.values(counts)
        .sort((a, b) => (b.failures + b.limits) - (a.failures + a.limits))
        .slice(0, 10);
  });
