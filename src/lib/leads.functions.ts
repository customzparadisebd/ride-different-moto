import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

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
    const { error } = await supabase.from(TABLE_LEADS as any).insert(data as any);
    if (error) throw new Error(error.message);
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
