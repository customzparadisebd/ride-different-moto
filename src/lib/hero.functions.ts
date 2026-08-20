import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const getHeroSlides = createServerFn({ method: "POST" })

  .validator((d: any) => z.object({ admin: z.boolean().optional() }).parse(d || {}))

  .handler(async ({ data: { admin }, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveActor } = await import("./admin.server");
    
    // SECURITY: Determine admin status from server-side session only
    let isAdmin = false;
    const ctx = context as any;
    const userId = ctx?.userId;
    const claims = ctx?.claims;

    if (userId) {
      try {
        const actor = await resolveActor(userId, claims);
        const isPrivileged = actor.isSuperAdmin || actor.primaryRole === "admin";
        isAdmin = (actor.status === "approved" || isPrivileged) && (isPrivileged || actor.permissions.includes(PERMISSIONS.contentManage));
      } catch {
        isAdmin = false;
      }
    }
    
    // Join with bike_models to get name and slug if linked
    const query = supabaseAdmin
      .from("hero_slides")
      .select(`
        *,
        bike_model:bike_models(id, name, slug, image_url)
      `);

    // SECURITY: Use server-resolved isAdmin flag, never the client-supplied one.
    if (!isAdmin) {
      query.eq("is_active", true);
    }

    const { data: slides, error } = await query.order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    return (slides || []).map((slide) => {
      const bikeModel = (slide as any).bike_model;
      return {
        id: slide.id,
        bikeName: slide.title || bikeModel?.name,
        label: slide.subtitle || undefined,
        image: slide.image_url || bikeModel?.image_url,
        mobileImage: (slide as any).mobile_image_url || undefined,
        alt: slide.title,
        bikeSlug: bikeModel?.slug || slide.link_url || "all-products",
        order: slide.sort_order,
        active: slide.is_active,
        isFullBanner: slide.title?.includes("Perfect Price") || false,
        bikeModelId: (slide as any).bike_model_id,
      };
    });
  });

export const updateHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().uuid(),
        updates: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional().nullable(),
          image_url: z.string().optional(),
          mobile_image_url: z.string().optional().nullable(),
          link_url: z.string().optional().nullable(),
          link_label: z.string().optional().nullable(),
          sort_order: z.number().optional(),
          is_active: z.boolean().optional(),
          // The admin form submits "" when no bike model is selected — treat it as null.
          bike_model_id: z
            .preprocess((v) => (typeof v === "string" && (v.trim() === "" || v === "none") ? null : v), z.string().uuid({ message: "Invalid bike model ID format" }).nullable())
            .optional(),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("hero_slides")
      .update(data.updates as any)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        title: z.string(),
        subtitle: z.string().optional().nullable(),
        image_url: z.string(),
        mobile_image_url: z.string().optional().nullable(),
        link_url: z.string().optional().nullable(),
        link_label: z.string().optional().nullable(),
        sort_order: z.number().default(0),
        is_active: z.boolean().default(true),
        bike_model_id: z
          .preprocess((v) => (typeof v === "string" && (v.trim() === "" || v === "none") ? null : v), z.string().uuid({ message: "Invalid bike model ID format" }).nullable())
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase.from("hero_slides").insert(data as any);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.string().uuid().parse(d))
  .handler(async ({ data: id, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase.from("hero_slides").delete().eq("id", id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreOldHeroSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.any().parse(d))
  .handler(async ({ context }) => {

    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { restoreHeroSlides } = await import("./hero-restore.server");
    return restoreHeroSlides();
  });

export const getActiveBikeModelsForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { data, error } = await context.supabase
      .from("bike_models")
      .select("id, name, slug, is_active, sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  });

export const updateBikeModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      id: z.string().uuid(),
      updates: z.object({
        name: z.string().optional(),
        slug: z.string().optional(),
        label: z.string().optional().nullable(),
        sort_order: z.number().optional(),
        is_active: z.boolean().optional(),
      }),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("bike_models")
      .update(data.updates as any)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderHeroSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        ids: z.array(z.string().uuid()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await Promise.all(
      data.ids.map((id, index) =>
        context.supabase
          .from("hero_slides")
          .update({ sort_order: index } as any)
          .eq("id", id),
      ),
    ).then((results) => {
      const err = results.find((r) => r.error);
      return err ? err : { error: null };
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBikeModelImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().uuid(),
        imageUrl: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("bike_models")
      .update({ image_url: data.imageUrl } as any)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
