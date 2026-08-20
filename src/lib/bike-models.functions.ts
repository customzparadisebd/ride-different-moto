import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const getStorefrontBikeModel = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: model, error } = await supabaseAdmin
      .from("bike_models")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!model) return null;

    return {
      id: model.id,
      slug: model.slug,
      name: model.name,
      label: model.label || "Modification Parts",
      image: model.image_url || "/placeholder-bike.jpg",
      alt: model.alt_text || model.name,
      order: model.sort_order ?? 0,
      active: model.is_active ?? true,
    };
  });

export const getStorefrontBikeModels = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bike_models")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((model) => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      label: model.label || "Modification Parts",
      image: model.image_url || "/placeholder-bike.jpg",
      alt: model.alt_text || model.name,
      order: model.sort_order ?? 0,
      active: model.is_active ?? true,
    }));
  });

/** Admin: Fetch all models for management */
export const getAdminBikeModels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    // Either productsManage or contentManage can handle bike models
    try {
      assertAccess(actor, PERMISSIONS.productsManage);
    } catch {
      assertAccess(actor, PERMISSIONS.contentManage);
    }

    const { data, error } = await context.supabase
      .from("bike_models")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map((model) => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      label: model.label,
      image_url: model.image_url,
      alt_text: model.alt_text,
      sort_order: model.sort_order,
      is_active: model.is_active,
    }));
  });

export const createBikeModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) =>
    z
      .object({
        name: z.string().min(1),
        slug: z.string().min(1),
        label: z.string().optional().nullable(),
        image_url: z.string().url().optional().nullable(),
        alt_text: z.string().optional().nullable(),
        sort_order: z.number().int().default(0),
        is_active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    try {
      assertAccess(actor, PERMISSIONS.productsManage);
    } catch {
      assertAccess(actor, PERMISSIONS.contentManage);
    }

    const { error } = await context.supabase.from("bike_models").insert(data);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateBikeModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) =>
    z
      .object({
        id: z.string().uuid(),
        updates: z.object({
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          label: z.string().optional().nullable(),
          image_url: z.string().url().optional().nullable(),
          alt_text: z.string().optional().nullable(),
          sort_order: z.number().int().optional(),
          is_active: z.boolean().optional(),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    try {
      assertAccess(actor, PERMISSIONS.productsManage);
    } catch {
      assertAccess(actor, PERMISSIONS.contentManage);
    }

    const { error } = await context.supabase
      .from("bike_models")
      .update(data.updates)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteBikeModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    try {
      assertAccess(actor, PERMISSIONS.productsManage);
    } catch {
      assertAccess(actor, PERMISSIONS.contentManage);
    }

    const { error } = await context.supabase.from("bike_models").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const reorderBikeModels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({ ids: z.array(z.string().uuid()) }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    try {
      assertAccess(actor, PERMISSIONS.productsManage);
    } catch {
      assertAccess(actor, PERMISSIONS.contentManage);
    }

    const { error } = await Promise.all(
      data.ids.map((id, index) =>
        context.supabase.from("bike_models").update({ sort_order: index }).eq("id", id),
      ),
    ).then((results) => {
      const err = results.find((r) => r.error);
      return err ? err : { error: null };
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });
