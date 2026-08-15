// ============================================================
// STEADFAST INTEGRATION ENDPOINTS
// Purpose: (1) read/save the SteadFast API settings, (2) send a
//          batch of selected orders to SteadFast in bulk.
// Status: COMPLETED
// Security: Reading/saving the credentials requires an Admin or
//          Super Admin account — Staff and Managers are rejected
//          server-side and the API key/secret are NEVER returned to
//          the browser (only "stored" flags). Bulk sending requires
//          the shipments.create permission. Every call is audited.
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import type { AdminActor } from "./admin.server";
import {
  bulkSteadfastInput,
  CLEAR_SECRET,
  steadfastSettingsInput,
  STEADFAST_DEFAULT_BASE_URL,
  STEADFAST_SLUG,
  type BulkShipmentRow,
  type SteadfastSettings,
  type SteadfastApiLog,
} from "./steadfast.shared";

/** Admin + Super Admin only — credentials are off-limits to Staff/Managers. */
function assertCredentialAccess(actor: AdminActor) {
  const allowed = actor.isSuperAdmin || actor.roles.includes("admin");
  if (!allowed || !actor.isStaff) {
    throw new Error("Only an Admin or Super Admin can manage the SteadFast API credentials.");
  }
}

/** "" = keep stored value, "__clear__" = wipe, anything else = set. */
function secretUpdate(value: string | undefined) {
  if (value === undefined || value === "") return undefined;
  return value === CLEAR_SECRET ? null : value;
}

// ------------------------------------------------------------
// SETTINGS — read
// ------------------------------------------------------------
export const getSteadfastSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SteadfastSettings> => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertCredentialAccess(actor);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: courier } = await supabaseAdmin
      .from("couriers")
      .select("id, base_url, is_active")
      .eq("slug", STEADFAST_SLUG)
      .is("deleted_at", null)
      .maybeSingle();

    if (!courier) {
      return {
        courierId: null,
        baseUrl: STEADFAST_DEFAULT_BASE_URL,
        isActive: false,
        hasApiKey: false,
        hasApiSecret: false,
        configured: false,
      };
    }

    const { data: creds } = await supabaseAdmin
      .from("courier_credentials")
      .select("api_key, api_secret")
      .eq("courier_id", courier.id)
      .maybeSingle();

    const hasApiKey = Boolean(creds?.api_key);
    const hasApiSecret = Boolean(creds?.api_secret);
    return {
      courierId: courier.id,
      baseUrl: courier.base_url ?? "",
      isActive: courier.is_active,
      hasApiKey,
      hasApiSecret,
      configured: courier.is_active && Boolean(courier.base_url) && hasApiKey && hasApiSecret,
    };
  });

// ------------------------------------------------------------
// SETTINGS — save / activate / deactivate
// ------------------------------------------------------------
export const saveSteadfastSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => steadfastSettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertCredentialAccess(actor);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensureSteadfastCourier } = await import("./steadfast.server");
    const courierId = await ensureSteadfastCourier(context.userId);

    const { error } = await supabaseAdmin
      .from("couriers")
      .update({ base_url: data.baseUrl.replace(/\/+$/, ""), is_active: data.isActive })
      .eq("id", courierId);
    if (error) throw new Error("Could not save the SteadFast settings.");

    // Only the credential slots the form actually sent are touched.
    const patch: Record<string, string | null> = {};
    const key = secretUpdate(data.apiKey);
    const secret = secretUpdate(data.apiSecret);
    if (key !== undefined) patch["api_key"] = key;
    if (secret !== undefined) patch["api_secret"] = secret;

    if (Object.keys(patch).length > 0) {
      const { error: credError } = await supabaseAdmin.from("courier_credentials").upsert(
        {
          courier_id: courierId,
          ...patch,
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "courier_id" },
      );
      if (credError) throw new Error("Could not save the SteadFast credentials.");

      await auditFromActor(actor, {
        action: AUDIT_ACTIONS.courierCredentialsChanged,
        targetType: "courier",
        targetId: courierId,
        targetLabel: "SteadFast",
        // Only WHICH slots changed is recorded — never the values.
        metadata: { fields: Object.keys(patch) },
      });
    }

    await auditFromActor(actor, {
      action: data.isActive ? AUDIT_ACTIONS.courierActivated : AUDIT_ACTIONS.courierDeactivated,
      targetType: "courier",
      targetId: courierId,
      targetLabel: "SteadFast",
      metadata: { baseUrl: data.baseUrl },
    });

    return { courierId };
  });

// ------------------------------------------------------------
// TESTING & LOGS
// ------------------------------------------------------------
export const testSteadfastConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertCredentialAccess(actor);

    const { testCourierConnection } = await import("./couriers.functions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: courier } = await supabaseAdmin
      .from("couriers")
      .select("id")
      .eq("slug", STEADFAST_SLUG)
      .maybeSingle();

    if (!courier) throw new Error("SteadFast integration not found.");
    return testCourierConnection({ data: { courierId: courier.id } });
  });

export const getSteadfastLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SteadfastApiLog[]> => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertCredentialAccess(actor);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: courier } = await supabaseAdmin
      .from("couriers")
      .select("id")
      .eq("slug", STEADFAST_SLUG)
      .maybeSingle();

    if (!courier) return [];

    const { data: logs, error } = await supabaseAdmin
      .from("courier_api_logs")
      .select(
        `
        id,
        action,
        success,
        status_code,
        message,
        created_at,
        profiles(email)
      `,
      )
      .eq("courier_id", courier.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error("Could not load API logs.");

    return (logs ?? []).map((l) => ({
      id: l.id,
      action: l.action,
      success: l.success,
      status_code: l.status_code,
      message: l.message,
      created_at: l.created_at,
      actor_email: (l.profiles as any)?.email ?? null,
    }));
  });

export const cancelSteadfastShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.shipmentsCreate);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, invoice_no, courier_id, consignment_id")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order?.consignment_id) throw new Error("No consignment found for this order.");

    const { loadCourierContext, logCourierApi } = await import("./couriers.server");
    const ctx = await loadCourierContext(order.courier_id!);
    if (!ctx) throw new Error("SteadFast integration is not configured.");

    // SteadFast cancel API: POST /cancel_order/{consignment_id}
    const res = await fetch(`${ctx.baseUrl}/cancel_order/${order.consignment_id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Api-Key": ctx.credentials.api_key ?? "",
        "Secret-Key": ctx.credentials.api_secret ?? "",
      },
    });

    const payload = (await res.json()) as any;
    const success = res.ok && (payload.status === 200 || payload.status === "200");

    await logCourierApi({
      courierId: ctx.courier.id,
      orderId: order.id,
      action: "cancel_shipment",
      success,
      statusCode: String(res.status),
      message: payload.message || (success ? "Cancelled successfully" : "Failed to cancel"),
      actorId: context.userId,
    });

    if (success) {
      await supabaseAdmin
        .from("orders")
        .update({
          courier_status: "cancelled",
          consignment_id: null,
          courier_tracking_id: null,
          tracking_url: null,
        })
        .eq("id", order.id);

      await supabaseAdmin.from("order_events").insert({
        order_id: order.id,
        event_type: "courier.shipment_cancelled",
        message: `SteadFast shipment cancelled. ${payload.message || ""}`,
        actor: context.userId,
        actor_label: actor.email ?? "staff",
      });
    }

    return { success, message: payload.message };
  });

export const getSteadfastTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersView);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, courier_id, consignment_id")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order?.consignment_id) return { events: [] };

    const { loadCourierContext } = await import("./couriers.server");
    const ctx = await loadCourierContext(order.courier_id!);
    if (!ctx) return { events: [] };

    // 1. Get stored events
    const { data: storedEvents } = await supabaseAdmin
      .from("courier_tracking_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });

    // 2. Fetch latest from API (real-time check)
    try {
      const res = await fetch(
        `${ctx.baseUrl}/status_by_cid/${encodeURIComponent(order.consignment_id)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Api-Key": ctx.credentials.api_key ?? "",
            "Secret-Key": ctx.credentials.api_secret ?? "",
          },
        },
      );

      if (res.ok) {
        const payload = (await res.json()) as any;
        // Steadfast status_by_cid usually returns latest.
        // We add it to the timeline if it's new/relevant.
        const latestStatus = payload.delivery_status || payload.status;
        if (latestStatus) {
          return {
            events: storedEvents ?? [],
            latest: {
              status: latestStatus,
              message: payload.message || "Latest status from API",
              time: new Date().toISOString(),
              raw: payload,
            },
          };
        }
      }
    } catch (e) {
      console.error("Steadfast tracking fetch failed", e);
    }

    return { events: storedEvents ?? [] };
  });

// ------------------------------------------------------------
// BULK SEND — validate, book, report per order
// ------------------------------------------------------------
export const bulkSendToSteadfast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bulkSteadfastInput.parse(input))
  .handler(async ({ data, context }): Promise<{ results: BulkShipmentRow[] }> => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.shipmentsCreate);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { bookOrderWithSteadfast } = await import("./steadfast.server");

    const { data: courier } = await supabaseAdmin
      .from("couriers")
      .select("id, is_active")
      .eq("slug", STEADFAST_SLUG)
      .is("deleted_at", null)
      .maybeSingle();
    // TODO: SteadFast credentials must be added in Admin → Settings before this works.
    if (!courier) throw new Error("SteadFast is not set up yet. Add the API details in Settings.");
    if (!courier.is_active) throw new Error("SteadFast is switched off in Settings.");

    const { data: orders, error } = await context.supabase
      .from("orders")
      .select(
        "id, invoice_no, customer_name, customer_phone, address_line, city, delivery_zone, total, advance_paid, status, consignment_id",
      )
      .in("id", data.orderIds)
      .is("deleted_at", null);
    if (error) throw new Error("Could not load the selected orders.");

    const label = actor.email ?? "staff";
    const results: BulkShipmentRow[] = [];

    // Sequential on purpose: one clear result per order, no API rate spikes.
    for (const order of orders ?? []) {
      try {
        results.push(
          await bookOrderWithSteadfast(courier.id, order as never, {
            userId: context.userId,
            label,
          }),
        );
      } catch (bookError) {
        results.push({
          orderId: order.id,
          invoiceNo: order.invoice_no,
          success: false,
          message: bookError instanceof Error ? bookError.message : "Sending failed.",
        });
      }
    }

    const sent = results.filter((row) => row.success).length;
    await auditFromActor(actor, {
      action: sent ? AUDIT_ACTIONS.courierShipmentCreated : AUDIT_ACTIONS.courierShipmentFailed,
      targetType: "order",
      targetId: null,
      targetLabel: `SteadFast bulk · ${sent}/${results.length}`,
      metadata: { requested: data.orderIds.length, sent, failed: results.length - sent },
    });

    return { results };
  });
