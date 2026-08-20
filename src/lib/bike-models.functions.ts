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
        label: z.string().nullish(),
        image_url: z.string().nullish(),
        alt_text: z.string().nullish(),
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

    const insertData: any = {
      name: data.name,
      slug: data.slug,
      label: data.label ?? null,
      image_url: data.image_url ?? null,
      alt_text: data.alt_text ?? null,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };

    const { error } = await context.supabase.from("bike_models").insert(insertData);
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
          label: z.string().nullish(),
          image_url: z.string().nullish(),
          alt_text: z.string().nullish(),
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

    const updates: any = {};
    if (data.updates.name !== undefined) updates.name = data.updates.name;
    if (data.updates.slug !== undefined) updates.slug = data.updates.slug;
    if (data.updates.label !== undefined) updates.label = data.updates.label ?? null;
    if (data.updates.image_url !== undefined) updates.image_url = data.updates.image_url ?? null;
    if (data.updates.alt_text !== undefined) updates.alt_text = data.updates.alt_text ?? null;
    if (data.updates.sort_order !== undefined) updates.sort_order = data.updates.sort_order;
    if (data.updates.is_active !== undefined) updates.is_active = data.updates.is_active;

    const { error } = await context.supabase
      .from("bike_models")
      .update(updates)
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
