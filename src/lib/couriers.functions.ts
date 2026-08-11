// ============================================================
// COURIER MANAGEMENT ENDPOINTS
// Purpose: CRUD for couriers, connection testing, shipment booking
//          and tracking refresh — all providers through one API.
// Status: COMPLETED
// Security: Reading the courier list needs couriers.view; creating
//          or editing a courier (including its API credentials)
//          needs couriers.manage (Super Admin only); booking needs
//          shipments.create; deleting is Super Admin only. Every
//          call re-checks the permission server-side and is audited.
//          Credentials are never returned to the browser — only
//          "is a value stored" flags.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  bookShipmentInput,
  CLEAR_SECRET,
  courierActiveInput,
  courierIdInput,
  courierInput,
  trackShipmentInput,
  type CourierSummary,
  type ShipmentResult,
} from "./couriers.shared";

/** Turns "" (keep) / "__clear__" (wipe) / value (set) into a column update. */
function secretUpdate(value: string | undefined) {
  if (value === undefined || value === "") return undefined;
  return value === CLEAR_SECRET ? null : value;
}

export const listCouriers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ couriers: CourierSummary[] }> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.couriersView);

    const { credentialFlags, objectToExtraFields } = await import("./couriers.server");
    const { data, error } = await context.supabase
      .from("couriers")
      .select(
        "id, slug, name, logo_url, phone, base_url, inside_charge, outside_charge, cod_percent, is_active, sort_order, extra_config",
      )
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error("Could not load the couriers.");

    const rows = data ?? [];
    const flags = await credentialFlags(rows.map((row) => row.id));

    return {
      couriers: rows.map((row) => {
        const set = flags.get(row.id) ?? {};
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          logoUrl: row.logo_url,
          phone: row.phone,
          baseUrl: row.base_url ?? "",
          insideCharge: Number(row.inside_charge),
          outsideCharge: Number(row.outside_charge),
          codPercent: Number(row.cod_percent),
          isActive: row.is_active,
          sortOrder: row.sort_order,
          extraFields: objectToExtraFields(row.extra_config),
          credentialsSet: {
            apiKey: Boolean(set["apiKey"]),
            apiSecret: Boolean(set["apiSecret"]),
            username: Boolean(set["username"]),
            password: Boolean(set["password"]),
            token: Boolean(set["token"]),
          },
        };
      }),
    };
  });

export const saveCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => courierInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.couriersManage);

    const { extraFieldsToObject } = await import("./couriers.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      slug: data.slug,
      name: data.name,
      logo_url: data.logoUrl || null,
      phone: data.phone || null,
      base_url: data.baseUrl || "",
      inside_charge: data.insideCharge,
      outside_charge: data.outsideCharge,
      cod_percent: data.codPercent,
      is_active: data.isActive,
      sort_order: data.sortOrder,
      extra_config: extraFieldsToObject(data.extraFields),
    };

    let courierId = data.id ?? null;

    // A soft-deleted courier still holds its slug (unique index), so a plain
    // insert would fail with 23505. Reuse the row instead, and give a clear
    // message when a *live* courier already owns the code.
    const { data: clash } = await supabaseAdmin
      .from("couriers")
      .select("id, name, deleted_at")
      .eq("slug", data.slug)
      .maybeSingle();

    if (clash && clash.id !== courierId) {
      if (clash.deleted_at) {
        courierId = clash.id;
      } else {
        throw new Error(
          `The code "${data.slug}" is already used by ${clash.name}. Pick another code.`,
        );
      }
    }

    if (courierId) {
      const { error } = await supabaseAdmin
        .from("couriers")
        .update({ ...row, deleted_at: null })
        .eq("id", courierId);
      if (error) {
        throw new Error(
          error.code === "23505"
            ? "Another courier already uses that code."
            : "Could not save the courier.",
        );
      }
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("couriers")
        .insert({ ...row, created_by: context.userId })
        .select("id")
        .single();
      if (error || !created) {
        throw new Error(
          error?.code === "23505"
            ? "Another courier already uses that code."
            : "Could not create the courier.",
        );
      }
      courierId = created.id;
    }

    // ---- Credentials: only touch the slots the panel actually sent ----
    const credentialPatch: Record<string, string | null> = {};
    const map = {
      api_key: data.credentials.apiKey,
      api_secret: data.credentials.apiSecret,
      username: data.credentials.username,
      password: data.credentials.password,
      token: data.credentials.token,
    } as const;
    for (const [column, value] of Object.entries(map)) {
      const next = secretUpdate(value);
      if (next !== undefined) credentialPatch[column] = next;
    }

    if (Object.keys(credentialPatch).length > 0) {
      const { error } = await supabaseAdmin.from("courier_credentials").upsert(
        {
          courier_id: courierId,
          ...credentialPatch,
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "courier_id" },
      );
      if (error) throw new Error("Could not save the courier credentials.");

      await auditFromActor(actor, {
        action: AUDIT_ACTIONS.courierCredentialsChanged,
        targetType: "courier",
        targetId: courierId,
        targetLabel: data.name,
        // Only WHICH slots changed is recorded — never the values.
        metadata: { fields: Object.keys(credentialPatch) },
      });
    }

    await auditFromActor(actor, {
      action: data.id ? AUDIT_ACTIONS.courierUpdated : AUDIT_ACTIONS.courierCreated,
      targetType: "courier",
      targetId: courierId,
      targetLabel: data.name,
      metadata: {
        slug: data.slug,
        insideCharge: data.insideCharge,
        outsideCharge: data.outsideCharge,
        codPercent: data.codPercent,
        isActive: data.isActive,
      },
    });

    return { courierId };
  });

export const setCourierActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => courierActiveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.couriersManage);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("couriers")
      .update({ is_active: data.isActive })
      .eq("id", data.courierId)
      .is("deleted_at", null)
      .select("name")
      .maybeSingle();
    if (error || !updated) throw new Error("Could not update the courier.");

    await auditFromActor(actor, {
      action: data.isActive ? AUDIT_ACTIONS.courierActivated : AUDIT_ACTIONS.courierDeactivated,
      targetType: "courier",
      targetId: data.courierId,
      targetLabel: updated.name,
    });
    return { ok: true };
  });

export const deleteCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => courierIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.couriersManage);
    if (!actor.isSuperAdmin) throw new Error("Only the Super Admin can remove a courier.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: removed, error } = await supabaseAdmin
      .from("couriers")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", data.courierId)
      .select("name")
      .maybeSingle();
    if (error || !removed) throw new Error("Could not remove the courier.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.courierDeleted,
      targetType: "courier",
      targetId: data.courierId,
      targetLabel: removed.name,
    });
    return { ok: true };
  });

export const testCourierConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => courierIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.couriersManage);

    const { adapterFor, loadCourierContext, logCourierApi } = await import("./couriers.server");
    const ctx = await loadCourierContext(data.courierId);
    if (!ctx) throw new Error("That courier no longer exists.");

    const adapter = adapterFor(ctx.courier.slug);
    const result = await adapter.ping(ctx);

    await logCourierApi({
      courierId: ctx.courier.id,
      action: "connection_test",
      success: result.ok,
      statusCode: result.status,
      message: result.message,
      actorId: context.userId,
    });
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.courierConnectionTested,
      targetType: "courier",
      targetId: ctx.courier.id,
      targetLabel: ctx.courier.name,
      metadata: { ok: result.ok, status: result.status },
    });

    return { ok: result.ok, message: result.message, requires: adapter.requires };
  });

export const bookShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bookShipmentInput.parse(input))
  .handler(async ({ data, context }): Promise<ShipmentResult> => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.shipmentsCreate);

    const { adapterFor, loadCourierContext, logCourierApi } = await import("./couriers.server");
    const { codFee, courierChargeForZone } = await import("./couriers.shared");

    const ctx = await loadCourierContext(data.courierId);
    if (!ctx) throw new Error("That courier no longer exists.");
    if (!ctx.courier.is_active) throw new Error(`${ctx.courier.name} is switched off in Couriers.`);

    const { data: order, error } = await context.supabase
      .from("orders")
      .select(
        "id, invoice_no, customer_name, customer_phone, address_line, city, delivery_zone, total, advance_paid, status, consignment_id",
      )
      .eq("id", data.orderId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !order) throw new Error("Could not load that order.");

    // DUPLICATE SHIPMENT GUARD — one live consignment per order.
    if (order.consignment_id && !data.retry) {
      return {
        orderId: order.id,
        invoiceNo: order.invoice_no,
        success: false,
        message: `Already booked (consignment ${order.consignment_id}).`,
        consignmentId: order.consignment_id,
      };
    }
    if (order.status === "cancelled" || order.status === "returned") {
      return {
        orderId: order.id,
        invoiceNo: order.invoice_no,
        success: false,
        message: "Cancelled or returned orders are not sent to a courier.",
      };
    }

    const codAmount = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);
    const courierSummary = {
      insideCharge: Number(ctx.courier.inside_charge),
      outsideCharge: Number(ctx.courier.outside_charge),
      codPercent: Number(ctx.courier.cod_percent),
    };

    const result = await adapterFor(ctx.courier.slug).book(ctx, {
      invoice: order.invoice_no,
      recipientName: order.customer_name,
      recipientPhone: order.customer_phone.replace(/[^0-9]/g, "").slice(-11),
      recipientAddress: order.address_line,
      city: order.city,
      codAmount,
      note: data.note || "",
    });

    const now = new Date().toISOString();
    const { data: shipment } = await context.supabase
      .from("courier_shipments")
      .insert({
        order_id: order.id,
        courier_id: ctx.courier.id,
        courier_name: ctx.courier.name,
        consignment_id: result.consignmentId,
        tracking_code: result.trackingCode,
        tracking_url: result.trackingUrl,
        courier_status: result.success ? result.courierStatus : "failed",
        success: result.success,
        response_status: result.status,
        response_message: result.message.slice(0, 300),
        cod_amount: codAmount,
        delivery_charge: courierChargeForZone(courierSummary, order.delivery_zone),
        booked_at: result.success ? now : null,
        last_status_at: now,
        is_active: result.success,
        sent_by: context.userId,
        sent_by_label: actor.email ?? "staff",
      })
      .select("id")
      .maybeSingle();

    if (result.success) {
      await context.supabase
        .from("orders")
        .update({
          courier_id: ctx.courier.id,
          courier_name: ctx.courier.name,
          courier_tracking_id: result.trackingCode,
          consignment_id: result.consignmentId,
          tracking_url: result.trackingUrl,
          courier_status: result.courierStatus,
          shipment_at: now,
        })
        .eq("id", order.id);

      await context.supabase.from("order_events").insert({
        order_id: order.id,
        event_type: "courier.shipment_created",
        message: `${ctx.courier.name} · ${result.message} · COD ${codAmount} (fee ~${codFee(courierSummary, codAmount)})`,
        actor: context.userId,
        actor_label: actor.email ?? "staff",
      });

      if (shipment?.id) {
        await context.supabase.from("courier_tracking_events").insert({
          shipment_id: shipment.id,
          order_id: order.id,
          courier_status: result.courierStatus,
          message: result.message.slice(0, 300),
          source: "booking",
        });
      }
    }

    await logCourierApi({
      courierId: ctx.courier.id,
      orderId: order.id,
      action: "book_shipment",
      success: result.success,
      statusCode: result.status,
      message: result.message,
      actorId: context.userId,
    });
    await auditFromActor(actor, {
      action: result.success
        ? AUDIT_ACTIONS.courierShipmentCreated
        : AUDIT_ACTIONS.courierShipmentFailed,
      targetType: "order",
      targetId: order.id,
      targetLabel: order.invoice_no,
      metadata: { courier: ctx.courier.name, consignmentId: result.consignmentId },
    });

    return {
      orderId: order.id,
      invoiceNo: order.invoice_no,
      success: result.success,
      message: result.message,
      consignmentId: result.consignmentId,
      trackingCode: result.trackingCode,
      trackingUrl: result.trackingUrl,
    };
  });

export const refreshShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => trackShipmentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.couriersView);

    const { adapterFor, loadCourierContext, logCourierApi } = await import("./couriers.server");

    const { data: order } = await context.supabase
      .from("orders")
      .select("id, invoice_no, courier_id, courier_status, consignment_id, courier_tracking_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order?.courier_id || !order.consignment_id) {
      throw new Error("This order has not been booked with a courier yet.");
    }

    const ctx = await loadCourierContext(order.courier_id);
    if (!ctx) throw new Error("That courier is no longer configured.");

    const result = await adapterFor(ctx.courier.slug).track(ctx, {
      consignmentId: order.consignment_id,
      trackingCode: order.courier_tracking_id,
    });

    await logCourierApi({
      courierId: ctx.courier.id,
      orderId: order.id,
      action: "track_shipment",
      success: result.ok,
      message: result.message,
      actorId: context.userId,
    });
    if (!result.ok) throw new Error(result.message);

    if (result.courierStatus !== order.courier_status) {
      const now = new Date().toISOString();
      const { data: shipment } = await context.supabase
        .from("courier_shipments")
        .select("id")
        .eq("order_id", order.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      await context.supabase
        .from("orders")
        .update({ courier_status: result.courierStatus })
        .eq("id", order.id);
      await context.supabase
        .from("courier_shipments")
        .update({ courier_status: result.courierStatus, last_status_at: now })
        .eq("order_id", order.id)
        .eq("is_active", true);
      if (shipment?.id) {
        await context.supabase.from("courier_tracking_events").insert({
          shipment_id: shipment.id,
          order_id: order.id,
          courier_status: result.courierStatus,
          message: result.raw ?? result.message,
          source: "manual_refresh",
        });
      }
      await context.supabase.from("order_events").insert({
        order_id: order.id,
        event_type: "courier.status_synced",
        message: `Courier status → ${result.courierStatus} (${result.raw ?? "unknown"})`,
        actor: context.userId,
        actor_label: actor.email ?? "staff",
      });
      await auditFromActor(actor, {
        action: AUDIT_ACTIONS.courierTrackingUpdated,
        targetType: "order",
        targetId: order.id,
        targetLabel: order.invoice_no,
        metadata: { courierStatus: result.courierStatus },
      });
    }

    return { courierStatus: result.courierStatus, raw: result.raw };
  });
