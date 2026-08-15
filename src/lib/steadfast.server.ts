// ============================================================
// STEADFAST BULK SHIPMENT — SERVER ONLY
// Purpose: Resolve/create the SteadFast courier row, read its
//          credentials and book one order at a time so the bulk
//          action can report a per-order result.
// Security: `.server.ts` is blocked from client bundles. Credentials
//          are read with the service-role client only and are never
//          returned, logged or audited.
// ============================================================
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { adapterFor, loadCourierContext, logCourierApi } from "./couriers.server";
import { codFee, courierChargeForZone } from "./couriers.shared";
import { STEADFAST_DEFAULT_BASE_URL, STEADFAST_SLUG, type BulkShipmentRow } from "./steadfast.shared";

/** Finds the SteadFast courier row, creating a switched-off one on first use. */
export async function ensureSteadfastCourier(actorId: string | null): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("couriers")
    .select("id, deleted_at")
    .eq("slug", STEADFAST_SLUG)
    .maybeSingle();

  if (existing) {
    if (existing.deleted_at) {
      await supabaseAdmin.from("couriers").update({ deleted_at: null }).eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await supabaseAdmin
    .from("couriers")
    .insert({
      slug: STEADFAST_SLUG,
      name: "SteadFast",
      base_url: STEADFAST_DEFAULT_BASE_URL,
      is_active: false,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error("Could not set up the SteadFast integration.");
  return created.id;
}

export type SteadfastOrderRow = {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  address_line: string;
  city: string;
  delivery_zone: string | null;
  total: number | string;
  advance_paid: number | string | null;
  status: string;
  consignment_id: string | null;
};

/** Basic pre-flight validation so we never call the API with junk. */
export function validateOrderForShipment(order: SteadfastOrderRow): string | null {
  const phone = order.customer_phone.replace(/[^0-9]/g, "");
  if (phone.length < 11) return "Customer phone number is not a valid 11-digit mobile number.";
  if (!order.customer_name.trim()) return "Customer name is missing.";
  if (order.address_line.trim().length < 8) return "Delivery address is too short.";
  if (order.status === "cancelled" || order.status === "returned") {
    return "Cancelled or returned orders are not sent to a courier.";
  }
  return null;
}

/**
 * Books ONE order with SteadFast and records the shipment, order fields,
 * timeline event, tracking event and API log. Duplicate-safe: an order that
 * already has a consignment is skipped, never re-sent.
 */
export async function bookOrderWithSteadfast(
  courierId: string,
  order: SteadfastOrderRow,
  actor: { userId: string; label: string },
): Promise<BulkShipmentRow> {
  // ---- Duplicate guard ----
  if (order.consignment_id) {
    return {
      orderId: order.id,
      invoiceNo: order.invoice_no,
      success: false,
      skipped: true,
      message: `Already sent (consignment ${order.consignment_id}).`,
      consignmentId: order.consignment_id,
    };
  }

  const invalid = validateOrderForShipment(order);
  if (invalid) {
    return { orderId: order.id, invoiceNo: order.invoice_no, success: false, message: invalid };
  }

  const ctx = await loadCourierContext(courierId);
  if (!ctx) throw new Error("The SteadFast integration is no longer configured.");
  if (!ctx.courier.is_active) throw new Error("SteadFast is switched off in Settings.");
  // TODO: if this trips, add the SteadFast API key + secret in Admin → Settings.
  if (!ctx.credentials.api_key || !ctx.credentials.api_secret || !ctx.baseUrl) {
    throw new Error("Add the SteadFast base URL, API key and API secret in Settings first.");
  }

  const codAmount = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);
  const charges = {
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
    note: "",
  });

  const now = new Date().toISOString();
  const { data: shipment } = await supabaseAdmin
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
      delivery_charge: courierChargeForZone(charges, order.delivery_zone),
      booked_at: result.success ? now : null,
      last_status_at: now,
      is_active: result.success,
      sent_by: actor.userId,
      sent_by_label: actor.label,
    })
    .select("id")
    .maybeSingle();

  if (result.success) {
    // ---- Persist what the panel displays: courier, consignment, tracking, status, time ----
    await supabaseAdmin
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

    try {
      await supabaseAdmin.rpc("increment_steadfast_count", { 
        order_id: order.id, 
        invoice_no: order.invoice_no 
      });
    } catch (e) {
      console.error("Failed to increment steadfast count:", e);
    }

    await supabaseAdmin.from("order_events").insert({
      order_id: order.id,
      event_type: "courier.shipment_created",
      message: `SteadFast bulk · ${result.message} · COD ${codAmount} (fee ~${codFee(charges, codAmount)})`,
      actor: actor.userId,
      actor_label: actor.label,
    });

    if (shipment?.id) {
      await supabaseAdmin.from("courier_tracking_events").insert({
        shipment_id: shipment.id,
        order_id: order.id,
        courier_status: result.courierStatus,
        message: result.message.slice(0, 300),
        source: "bulk_booking",
      });
    }
  }

  await logCourierApi({
    courierId: ctx.courier.id,
    orderId: order.id,
    action: "bulk_book_shipment",
    success: result.success,
    statusCode: result.status,
    message: result.message,
    actorId: actor.userId,
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
}