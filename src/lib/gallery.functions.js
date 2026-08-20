import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";
export const getGalleryItems = createServerFn({ method: "POST" })
    .validator((d) => z.object({ admin: z.boolean().optional() }).parse(d || {}))
    .handler(async ({ data: { admin }, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveActor } = await import("./admin.server");
    let isAdmin = false;
    const ctx = context;
    const userId = ctx?.userId;
    const claims = ctx?.claims;
    if (userId) {
        try {
            const actor = await resolveActor(userId, claims);
            const isPrivileged = actor.isSuperAdmin || actor.primaryRole === "admin" || actor.primaryRole === "manager";
            isAdmin = (actor.status === "approved" || isPrivileged) && (isPrivileged || actor.permissions.includes(PERMISSIONS.contentManage));
        }
        catch {
            isAdmin = false;
        }
    }
    const query = supabaseAdmin
        .from("gallery_items")
        .select("*");
    if (!isAdmin) {
        query.eq("is_active", true);
    }
    const { data, error } = await query.order("sort_order", { ascending: true });
    if (error)
        throw new Error(error.message);
    return (data || []).map((item) => ({
        id: item.id,
        image: item.image_url,
        alt: item.alt_text || "CZP Gallery Image",
        order: item.sort_order,
        active: item.is_active,
    }));
});
export const updateGalleryItem = createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator((d) => z.object({
    id: z.string().uuid(),
    updates: z.object({
        image_url: z.string().optional(),
        alt_text: z.string().optional().nullable(),
        sort_order: z.number().optional(),
        is_active: z.boolean().optional(),
    }),
}).parse(d))
    .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims);
    assertAccess(actor, PERMISSIONS.productsManage);
    const { error } = await context.supabase
        .from("gallery_items")
        .update(data.updates)
        .eq("id", data.id);
    if (error)
        throw new Error(error.message);
    return { ok: true };
});
export const createGalleryItem = createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator((d) => z.object({
    image_url: z.string(),
    alt_text: z.string().optional().nullable(),
    sort_order: z.number().default(0),
    is_active: z.boolean().default(true),
}).parse(d))
    .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims);
    assertAccess(actor, PERMISSIONS.productsManage);
    const { error } = await context.supabase.from("gallery_items").insert(data);
    if (error)
        throw new Error(error.message);
    return { ok: true };
});
export const deleteGalleryItem = createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator((d) => z.string().uuid().parse(d))
    .handler(async ({ data: id, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims);
    assertAccess(actor, PERMISSIONS.productsManage);
    const { error } = await context.supabase.from("gallery_items").delete().eq("id", id);
    if (error)
        throw new Error(error.message);
    return { ok: true };
});
export const reorderGalleryItems = createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator((d) => z.object({
    ids: z.array(z.string().uuid()),
}).parse(d))
    .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims);
    assertAccess(actor, PERMISSIONS.productsManage);
    const { error } = await Promise.all(data.ids.map((id, index) => context.supabase
        .from("gallery_items")
        .update({ sort_order: index })
        .eq("id", id))).then((results) => {
        const err = results.find((r) => r.error);
        return err ? err : { error: null };
    });
    if (error)
        throw new Error(error.message);
    return { ok: true };
});
