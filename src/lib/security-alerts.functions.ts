import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PERMISSIONS } from "./admin.shared";

export const listSecurityAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.securityManage);

    const { data: alerts, error } = await context.supabase
      .from("admin_notifications")
      .select("*")
      .eq("type", "security")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error("Could not load security alerts.");
    return alerts;
  });

export const listInvoiceCollisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.securityManage);

    const { data: collisions, error } = await context.supabase
      .from("invoice_collisions")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(50);

    if (error) throw new Error("Could not load invoice collisions.");
    return collisions;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) throw new Error("Could not update notification.");
    return { success: true };
  });
