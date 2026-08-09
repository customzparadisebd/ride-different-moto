// ============================================================
// COURIER (STEADFAST) ENDPOINTS
// Purpose: Test the connection, push confirmed orders to Steadfast
//          in bulk, and refresh delivery status from the courier.
// Status: COMPLETED
// Security: Requires orders.manage; the API test requires api.manage
//          (Super Admin only). Credentials never leave the server,
//          every shipment attempt is stored in courier_shipments and
//          audited, and an order that already has a consignment is
//          skipped so shipments cannot be duplicated.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";
import {
  mapCourierStatus,
  sendShipmentsInput,
  steadfastTrackingUrl,
  trackShipmentInput,
  type ShipmentResult,
} from "./courier.shared";

export const testCourierConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.apiManage);

    const { courierConfig, courierPing, courierSettings } = await import("./courier.server");
    const settings = await courierSettings(context.supabase as never);
    const config = courierConfig(settings.url);
    if (!config) {
      return {
        ok: false,
        configured: false,
        message: "Steadfast API key and secret are not set on the server yet.",
      };
    }

    const result = await courierPing(config);
    await auditFromActor(actor, {
      action: "courier.connection_tested",
      targetType: "integration",
      targetLabel: "steadfast",
      metadata: { ok: result.ok, status: result.status },
    });

    return {
      ok: result.ok,
      configured: true,
      message: result.ok
        ? "Connected to Steadfast successfully."
        : `Steadfast rejected the credentials (HTTP ${result.status}).`,
    };
  });

export const sendOrdersToCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendShipmentsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { courierConfig, courierCreateOrder, courierSettings } = await import("./courier.server");
    const settings = await courierSettings(context.supabase as never);
    if (!settings.enabled) {
      throw new Error("Turn the Steadfast integration on in Store settings first.");
    }
    const config = courierConfig(settings.url);
    if (!config) throw new Error("Steadfast API key and secret are not set on the server yet.");

    const { data: orders, error } = await context.supabase
      .from("orders")
      .select(
        "id, invoice_no, customer_name, customer_phone, address_line, city, total, advance_paid, status, consignment_id",
      )
      .in("id", data.orderIds)
      .is("deleted_at", null);
    if (error) throw new Error("Could not load the selected orders.");

    const results: ShipmentResult[] = [];

    for (const order of orders ?? []) {
      // DUPLICATE SHIPMENT GUARD
      if (order.consignment_id) {
        results.push({
          orderId: order.id,
          invoiceNo: order.invoice_no,
          success: false,
          message: `Already sent (consignment ${order.consignment_id}).`,
        });
        continue;
      }
      if (order.status === "cancelled" || order.status === "returned") {
        results.push({
          orderId: order.id,
          invoiceNo: order.invoice_no,
          success: false,
          message: "Cancelled or returned orders are not sent to the courier.",
        });
        continue;
      }

      const codAmount = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);
      const response = await courierCreateOrder(config, {
        invoice: order.invoice_no,
        recipientName: order.customer_name,
        recipientPhone: order.customer_phone.replace(/[^0-9]/g, "").slice(-11),
        recipientAddress: `${order.address_line}, ${order.city}`,
        codAmount,
        note: data.note || "",
      });

      const payload = (response.payload ?? {}) as {
        status?: number;
        message?: string;
        consignment?: { consignment_id?: number | string; tracking_code?: string; status?: string };
      };
      const consignment = payload.consignment;
      const consignmentId = consignment?.consignment_id
        ? String(consignment.consignment_id)
        : null;
      const trackingCode = consignment?.tracking_code ?? null;
      const success = response.ok && Boolean(consignmentId);

      await context.supabase.from("courier_shipments").insert({
        order_id: order.id,
        courier_name: "steadfast",
        consignment_id: consignmentId,
        tracking_code: trackingCode,
        tracking_url: trackingCode ? steadfastTrackingUrl(trackingCode) : null,
        courier_status: success ? mapCourierStatus(consignment?.status) : "pending",
        success,
        response_status: String(response.status),
        response_message: (payload.message ?? "").slice(0, 300),
        sent_by: context.userId,
        sent_by_label: actor.email ?? "staff",
      });

      if (success) {
        await context.supabase
          .from("orders")
          .update({
            courier_name: "Steadfast",
            courier_tracking_id: trackingCode,
            consignment_id: consignmentId,
            tracking_url: trackingCode ? steadfastTrackingUrl(trackingCode) : null,
            courier_status: mapCourierStatus(consignment?.status),
            shipment_at: new Date().toISOString(),
            courier_response: payload as never,
          })
          .eq("id", order.id);

        await context.supabase.from("order_events").insert({
          order_id: order.id,
          event_type: "courier.shipment_created",
          message: `Sent to Steadfast · consignment ${consignmentId}`,
          actor: context.userId,
          actor_label: actor.email ?? "staff",
        });
      }

      results.push({
        orderId: order.id,
        invoiceNo: order.invoice_no,
        success,
        message: success
          ? `Sent · consignment ${consignmentId}`
          : payload.message || `Steadfast returned HTTP ${response.status}.`,
        consignmentId,
        trackingCode,
      });
    }

    await auditFromActor(actor, {
      action: "courier.shipments_sent",
      targetType: "order",
      metadata: {
        requested: data.orderIds.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });

    return { results };
  });

export const refreshCourierStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => trackShipmentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { courierConfig, courierStatusByConsignment, courierSettings } = await import("./courier.server");
    const settings = await courierSettings(context.supabase as never);
    const config = courierConfig(settings.url);
    if (!config) throw new Error("Steadfast API key and secret are not set on the server yet.");

    const order = await context.supabase
      .from("orders")
      .select("id, consignment_id, courier_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order.data?.consignment_id) throw new Error("This order has no Steadfast consignment yet.");

    const response = await courierStatusByConsignment(config, order.data.consignment_id);
    const payload = (response.payload ?? {}) as { delivery_status?: string; message?: string };
    if (!response.ok) throw new Error(payload.message || "Steadfast did not return a status.");

    const mapped = mapCourierStatus(payload.delivery_status);
    if (mapped !== order.data.courier_status) {
      await context.supabase
        .from("orders")
        .update({ courier_status: mapped, courier_response: payload as never })
        .eq("id", data.orderId);
      await context.supabase.from("order_events").insert({
        order_id: data.orderId,
        event_type: "courier.status_synced",
        message: `Courier status → ${mapped} (${payload.delivery_status ?? "unknown"})`,
        actor: context.userId,
        actor_label: actor.email ?? "staff",
      });
    }

    return { courierStatus: mapped, raw: payload.delivery_status ?? null };
  });
