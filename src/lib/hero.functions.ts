import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";


export const getHeroSlides = createServerFn({ method: "GET" })
  .validator((d) => z.object({ admin: z.boolean().optional() }).parse(d || {}))
  .handler(async ({ data: { admin } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const query = supabaseAdmin.from("hero_slides").select("*");

    if (!admin) {
      query.eq("is_active", true);
    }

    const { data, error } = await query.order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((slide) => ({
      id: slide.id,
      bikeName: slide.title,
      label: slide.subtitle || undefined,
      image: slide.image_url,
      mobileImage: (slide as any).mobile_image_url || undefined,
      alt: slide.title,
      bikeSlug: slide.link_url || "all-products",
      order: slide.sort_order,
      active: slide.is_active,
      isFullBanner: slide.title.includes("Perfect Price"),
    }));
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
