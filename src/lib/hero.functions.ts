import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const getHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("active", true)
    .order("order", { ascending: true });
    
  if (error) throw new Error(error.message);
  
  return data.map(slide => ({
    id: slide.id,
    bikeName: slide.bike_name,
    label: slide.label,
    image: slide.image,
    mobileImage: slide.mobile_image || undefined,
    alt: slide.alt,
    bikeSlug: slide.bike_slug,
    order: slide.order,
    active: slide.active,
    isFullBanner: slide.is_full_banner,
    ctaText: slide.cta_text || undefined,
    ctaLink: slide.cta_link || undefined,
  }));
});

export const updateHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    updates: z.object({
      bike_name: z.string().optional(),
      label: z.string().optional(),
      image: z.string().optional(),
      mobile_image: z.string().optional().nullable(),
      alt: z.string().optional(),
      bike_slug: z.string().optional(),
      cta_text: z.string().optional().nullable(),
      cta_link: z.string().optional().nullable(),
      is_full_banner: z.boolean().optional(),
      order: z.number().optional(),
      active: z.boolean().optional(),
    })
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("hero_slides")
      .update(data.updates)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    bike_name: z.string(),
    label: z.string().optional(),
    image: z.string(),
    mobile_image: z.string().optional().nullable(),
    alt: z.string(),
    bike_slug: z.string().default("all-products"),
    is_full_banner: z.boolean().default(false),
    order: z.number().default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("hero_slides")
      .insert(data);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.string().uuid().parse(d))
  .handler(async ({ data: id, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("hero_slides")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
