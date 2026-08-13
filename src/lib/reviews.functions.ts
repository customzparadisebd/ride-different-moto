import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const getReviews = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ admin: z.boolean().optional() }).parse(d || {}))
  .handler(async ({ data: { admin } }) => {
    const query = supabase.from("reviews").select("*");
    if (!admin) query.eq("is_active", true);
    const { data, error } = await query.order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    updates: z.object({
      customer_name: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      comment: z.string().optional().nullable(),
      image_url: z.string().optional().nullable(),
      bike_model: z.string().optional().nullable(),
      is_active: z.boolean().optional(),
      sort_order: z.number().optional(),
    })
  }))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.contentManage);
    const { error } = await context.supabase.from("reviews").update(data.updates as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    customer_name: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    bike_model: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
    sort_order: z.number().default(0),
  }))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.contentManage);
    const { error } = await context.supabase.from("reviews").insert(data as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.string().uuid())
  .handler(async ({ data: id, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.contentManage);
    const { error } = await context.supabase.from("reviews").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
