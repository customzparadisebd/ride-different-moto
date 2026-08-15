import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";
import { orderFilterInput } from "./orders.shared";
import type { AdminOrderListRow } from "./orders.functions";

/**
 * Admin: Fetches ALL orders matching the filters for XLSX export.
 * Unlike listOrders, this returns the full set (up to 5000) without pagination
 * to fulfill the requirement for a real Excel export based on filters.
 */
export const getOrdersForExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderFilterInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    let query = context.supabase
      .from("orders")
      .select(
        "id, invoice_no, customer_name, customer_phone, city, address_line, delivery_zone, subtotal, discount, shipping, advance_paid, total, cod_amount, status, payment_status, payment_method, transaction_id, courier_status, courier_name, courier_tracking_id, consignment_id, tracking_url, shipment_at, order_source, created_at, created_by, assigned_to, is_pinned, is_duplicate, printed_at, print_count, notes, order_items(id, product_name, variant, image_url, unit_price, quantity, line_total)"
      )
      .is("deleted_at", null);

    // Apply Filters
    if (data.invoiceNo) {
      query = query.ilike("invoice_no", `%${data.invoiceNo.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    }
    if (data.customerName) {
      query = query.ilike("customer_name", `%${data.customerName.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    }
    if (data.customerPhone) {
      query = query.ilike("customer_phone", `%${data.customerPhone.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    }
    if (data.status) query = query.eq("status", data.status);
    if (data.paymentStatus) query = query.eq("payment_status", data.paymentStatus);
    if (data.deliveryZone) query = query.eq("delivery_zone", data.deliveryZone);
    if (data.dateFrom) query = query.gte("created_at", `${data.dateFrom}T00:00:00.000Z`);
    if (data.dateTo) query = query.lte("created_at", `${data.dateTo}T23:59:59.999Z`);
    if (data.source) query = query.eq("order_source", data.source);
    if (data.courier) {
      query = query.ilike("courier_name", `%${data.courier.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    }

    const { data: rows, error } = await query
      .order("created_at", { ascending: data.sortDir === "asc" })
      .limit(5000);

    if (error) throw new Error("Could not load orders for export.");

    // Resolve labels
    const staffIds = [
      ...new Set(
        (rows ?? [])
          .flatMap((row) => [row.created_by, row.assigned_to])
          .filter(Boolean) as string[],
      ),
    ];
    const staffLabels: Record<string, string> = {};
    if (staffIds.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", staffIds);
      for (const profile of profiles ?? [])
        staffLabels[profile.id] = profile.full_name || profile.email || "Staff";
    }

    return (rows ?? []).map<AdminOrderListRow>((row: any) => ({
      ...row,
      order_items: row.order_items ?? [],
      created_by_label: row.created_by ? (staffLabels[row.created_by] ?? null) : null,
      assigned_to_label: row.assigned_to ? (staffLabels[row.assigned_to] ?? null) : null,
      customer_order_count: 0, // Not needed for export
    }));
  });
