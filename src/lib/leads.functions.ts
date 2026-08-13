import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS, AUDIT_ACTIONS } from "./admin.shared";

// @ts-ignore - Tables might not be in types yet
const TABLE_LEADS = "leads";

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().nullable(),
    message: z.string().optional().nullable(),
    source: z.string().default("contact_form"),
  }))
  .handler(async ({ data }) => {
    const { data: inserted, error } = await supabase.from(TABLE_LEADS as any).insert(data as any).select().single();
    if (error) throw new Error(error.message);

    // Record audit for public lead capture (system actor)
    const { writeAudit } = await import("./admin.server");
    await writeAudit({
      action: AUDIT_ACTIONS.leadCaptured as any,
      targetType: "lead",
      targetId: (inserted as any).id,
      targetLabel: data.name,
      newValue: data,
    });

    return { ok: true };
  });

export const getLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.customersManage);
    const { data, error } = await context.supabase.from(TABLE_LEADS as any).select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });
