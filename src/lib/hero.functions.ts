import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const getHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
    
  if (error) throw new Error(error.message);
  
  return data.map(slide => ({
    id: slide.id,
    bikeName: slide.title,
    label: slide.subtitle,
    image: slide.image_url,
    mobileImage: slide.mobile_image_url || undefined,
    alt: slide.alt_text,
    bikeSlug: slide.link_url,
    order: slide.sort_order,
    active: slide.is_active,
    isFullBanner: slide.is_full_banner,
    ctaText: slide.link_label || undefined,
    ctaLink: slide.link_url || undefined,
  }));
});

export const updateHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    updates: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional().nullable(),
      image_url: z.string().optional(),
      mobile_image_url: z.string().optional().nullable(),
      alt_text: z.string().optional(),
      link_url: z.string().optional(),
      link_label: z.string().optional().nullable(),
      is_full_banner: z.boolean().optional(),
      sort_order: z.number().optional(),
      is_active: z.boolean().optional(),
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
    title: z.string(),
    subtitle: z.string().optional().nullable(),
    image_url: z.string(),
    mobile_image_url: z.string().optional().nullable(),
    alt_text: z.string(),
    link_url: z.string().default("/"),
    link_label: z.string().optional().nullable(),
    is_full_banner: z.boolean().default(false),
    sort_order: z.number().default(0),
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

