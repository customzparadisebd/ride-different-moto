// ============================================================
// CITY & DELIVERY ZONES — COMPLETED (endpoints)
// Purpose: Public checkout configuration read, plus admin CRUD for
//          the city list and the delivery zones/charges.
// Security: Reads are public and return display values only. Every
//          write requires the zones.manage permission, re-checked
//          server-side from the verified bearer token, and audited.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  cityIdInput,
  cityInput,
  cityReorderInput,
  zoneUpdateInput,
  type CheckoutConfig,
  type City,
  type DeliveryZoneOption,
} from "./checkout-config.shared";

export const getCheckoutConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<CheckoutConfig> => {
    const { fetchCheckoutConfig } = await import("./checkout-config.server");
    return fetchCheckoutConfig();
  },
);

/** Admin view: every city and zone, including the disabled ones. */
export const listCheckoutConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ cities: City[]; zones: DeliveryZoneOption[] }> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor);

    const [cities, zones] = await Promise.all([
      context.supabase
        .from("cities")
        .select("id, name, is_active, sort_order")
        .order("sort_order")
        .order("name"),
      context.supabase
        .from("delivery_zones")
        .select("id, slug, name, charge, is_active, sort_order")
        .order("sort_order"),
    ]);
    if (cities.error || zones.error) throw new Error("Could not load the checkout settings.");

    return {
      cities: (cities.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.is_active,
        sortOrder: row.sort_order,
      })),
      zones: (zones.data ?? []).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        charge: Number(row.charge),
        isActive: row.is_active,
        sortOrder: row.sort_order,
      })),
    };
  });

export const saveCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => cityInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.zonesManage);

    const row = { name: data.name, is_active: data.isActive, sort_order: data.sortOrder };
    if (data.id) {
      const { error } = await context.supabase.from("cities").update(row).eq("id", data.id);
      if (error) throw new Error("Could not save that city. The name may already exist.");
    } else {
      const { error } = await context.supabase.from("cities").insert(row);
      if (error) throw new Error("Could not add that city. The name may already exist.");
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "city",
      targetId: data.id ?? data.name,
      targetLabel: data.name,
      newValue: row as never,
    });
    return { ok: true };
  });

export const deleteCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => cityIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.zonesManage);

    const { error } = await context.supabase.from("cities").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove that city.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "city",
      targetId: data.id,
      targetLabel: "City removed",
    });
    return { ok: true };
  });

/** Persists the new display order as sent by the admin list. */
export const reorderCities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => cityReorderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.zonesManage);

    for (const [index, id] of data.ids.entries()) {
      const { error } = await context.supabase
        .from("cities")
        .update({ sort_order: index + 1 })
        .eq("id", id);
      if (error) throw new Error("Could not reorder the cities.");
    }
    return { ok: true };
  });

export const saveDeliveryZone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => zoneUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.zonesManage);

    const before = await context.supabase
      .from("delivery_zones")
      .select("name, charge, is_active, sort_order")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await context.supabase
      .from("delivery_zones")
      .update({
        name: data.name,
        charge: data.charge,
        is_active: data.isActive,
        sort_order: data.sortOrder,
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not save that delivery zone.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "delivery_zone",
      targetId: data.id,
      targetLabel: data.name,
      oldValue: (before.data ?? null) as never,
      newValue: data as never,
    });
    return { ok: true };
  });
