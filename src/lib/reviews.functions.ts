import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

// @ts-ignore - Tables might not be in types yet
const TABLE_REVIEWS = "reviews";

export const getReviews = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ admin: z.boolean().optional() }).parse(d || {}))
  .handler(async ({ data: { admin } }) => {
    const query = supabase.from(TABLE_REVIEWS as any).select("*");
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
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.reviewsManage);
    
    const before = await context.supabase.from(TABLE_REVIEWS as any).select("*").eq("id", data.id).single();
    
    const { error } = await context.supabase.from(TABLE_REVIEWS as any).update(data.updates as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.reviewUpdated as any,
      targetType: "review",
      targetId: data.id,
      oldValue: before.data,
      newValue: data.updates,
    });
    
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
    const { error } = await context.supabase.from(TABLE_REVIEWS as any).insert(data as any);
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
    const { error } = await context.supabase.from(TABLE_REVIEWS as any).delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
