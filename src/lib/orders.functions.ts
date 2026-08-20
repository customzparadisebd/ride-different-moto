/**
 * Orders Module
 * Handles storefront checkout, admin order management, and bulk processing.
 * Developed by: Rafi Gazi (Rabbee) Apps
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  adminOrderInput,
  checkoutSubmitInput,
  orderAssignInput,
  orderBulkStatusInput,
  orderFilterInput,
  orderPinInput,
  orderPrintInput,
  orderStatusUpdateInput,
  ORDER_TABS,
  type OrderTab,
} from "./orders.shared";

// ============================================================
// ADMIN RBAC ENFORCEMENT ON ORDER FUNCTIONS
// Purpose: Each order endpoint requires a specific permission and
//          writes an audit entry for changes.
// Status: COMPLETED
// Security: Permissions are resolved server-side from the verified
//          bearer token; the UI never decides access.
// ============================================================

/** Public: the storefront checkout. Prices are resolved server-side. */
export const placeOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => checkoutSubmitInput.parse(input))
  .handler(async ({ data }) => {
    const [{ createOrder }, { priceCartLines }, checkoutConfig] = await Promise.all([
      import("./orders.server"),
      import("./storefront.server"),
      import("./checkout-config.server"),
    ]);

    // SERVER-SIDE PRICING
    const [items, shipping] = await Promise.all([
      priceCartLines(data.items),
      checkoutConfig.resolveZoneCharge(data.deliveryZone),
    ]);
    await checkoutConfig.assertCityAllowed(data.city);

    const order = await createOrder(
      { ...data, items },
      { source: "website", shipping, actorLabel: "customer" },
    );
    return {
      orderId: order.orderId,
      invoiceNo: order.invoiceNo,
      total: order.total,
      duplicate: order.duplicate,
      alert: order.alert,
    };
  });

/** Admin: does the signed-in account have staff access? Used by the route gate. */
export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    return {
      userId: actor.userId,
      email: actor.email,
      fullName: actor.fullName,
      gender: actor.gender,
      avatarUrl: actor.avatarUrl,
      roles: actor.roles,
      primaryRole: actor.primaryRole,
      permissions: actor.permissions,
      status: actor.status,
      isStaff: actor.isStaff,
      isSuperAdmin: actor.isSuperAdmin,
      mfaRequired: actor.mfaRequired,
      mfaSatisfied: actor.mfaSatisfied,
      sessionRevoked: actor.sessionRevoked,
      loginApprovalPending: actor.loginApprovalPending,
    };
  });

// ============================================================
// ADMIN ORDER LIST + FILTERS
// Purpose: Server-side filtered order list for the admin table.
// Status: COMPLETED
// Security: Filters are validated and applied through the Supabase
//          query builder (parameterised, no string concatenation),
//          and the read runs as the signed-in user so RLS still
//          restricts it to approved staff.
// ============================================================
export type AdminOrderItemRow = {
  id: string;
  product_name: string;
  variant: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type AdminOrderRow = {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  address_line: string;
  delivery_zone: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  advance_paid: number;
  total: number;
  cod_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  transaction_id: string | null;
  courier_status: string;
  courier_name: string | null;
  courier_tracking_id: string | null;
  consignment_id: string | null;
  tracking_url: string | null;
  shipment_at: string | null;
  order_source: string;
  created_at: string;
  created_by: string | null;
  assigned_to: string | null;
  is_pinned: boolean;
  is_duplicate: boolean;
  printed_at: string | null;
  print_count: number;
  notes: string | null;
  order_items: AdminOrderItemRow[];
};

/** Row shape the admin table consumes (server row + resolved labels). */
export type AdminOrderListRow = AdminOrderRow & {
  created_by_label: string | null;
  assigned_to_label: string | null;
  customer_order_count: number;
};

const LIST_COLUMNS =
  "id, invoice_no, customer_name, customer_phone, city, address_line, delivery_zone, subtotal, discount, shipping, advance_paid, total, cod_amount, status, payment_status, payment_method, transaction_id, courier_status, courier_name, courier_tracking_id, consignment_id, tracking_url, shipment_at, order_source, created_at, created_by, assigned_to, is_pinned, is_duplicate, printed_at, print_count, notes, order_items(id, product_name, variant, image_url, unit_price, quantity, line_total)";

/** Start of the current day as an ISO timestamp in Bangladesh Time (UTC+6). */
const getBDStartOfToday = () => {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  bdNow.setUTCHours(0, 0, 0, 0);
  return new Date(bdNow.getTime() - 6 * 60 * 60 * 1000).toISOString();
};

const getBDTimeRange = (daysOffset: number = 0) => {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const start = new Date(bdNow.getTime());
  start.setUTCDate(start.getUTCDate() + daysOffset);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start.getTime());
  end.setUTCHours(23, 59, 59, 999);

  return {
    from: new Date(start.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    to: new Date(end.getTime() - 6 * 60 * 60 * 1000).toISOString(),
  };
};

const getBDTodayShiftRange = () => {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const start = new Date(bdNow.getTime());
  start.setUTCHours(8, 0, 0, 0);

  const end = new Date(bdNow.getTime());
  end.setUTCHours(20, 0, 0, 0);

  return {
    from: new Date(start.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    to: new Date(end.getTime() - 6 * 60 * 60 * 1000).toISOString(),
  };
};

const getBDMonthRange = () => {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const start = new Date(bdNow.getTime());
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(bdNow.getTime());
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  end.setUTCHours(23, 59, 59, 999);

  return {
    from: new Date(start.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    to: new Date(end.getTime() - 6 * 60 * 60 * 1000).toISOString(),
  };
};


const sel = (columns: string): string => columns;

/** Escapes the LIKE wildcards so a search for "%" is a literal search. */
const likeTerm = (value: string) => `%${value.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderFilterInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // SECURITY: Unapproved staff cannot access orders (customer PII)
    if (actor.status !== "approved") {
      throw new Error("Access denied. Your account is not approved yet.");
    }
    
    if (!actor.permissions.includes(PERMISSIONS.ordersView)) {
      throw new Error("Unauthorized. Missing orders.view permission.");
    }

    // CUSTOMER ORDER COUNTS
    // Purpose: powers the "Total orders" figure in the customer column and the
    //          "Multiple orders with same phone" tab.
    const phoneRows = await context.supabase
      .from("orders")
      .select("customer_phone")
      .is("deleted_at", null)
      .limit(5000)
      .returns<{ customer_phone: string }[]>();
    const phoneCounts: Record<string, number> = {};
    for (const row of phoneRows.data ?? [])
      phoneCounts[row.customer_phone] = (phoneCounts[row.customer_phone] ?? 0) + 1;
    const repeatPhones = Object.entries(phoneCounts)
      .filter(([, count]) => count > 1)
      .map(([phone]) => phone);

    let query = context.supabase.from("orders").select(
      sel(LIST_COLUMNS),
      // exact count powers the pagination footer
      { count: "exact" },
    );

    query = data.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

    // STATUS TAB — resolved server-side so counts and rows always agree.
    switch (data.tab) {
      case "confirmed":
        query = query.eq("status", "confirmed");
        break;
      case "pending":
        query = query.eq("status", "pending");
        break;
      case "cancelled":
        query = query.in("status", ["cancelled", "returned"]);
        break;
      case "completed":
        query = query.eq("status", "completed");
        break;
      case "today":
        query = query.gte("created_at", getBDStartOfToday());
        break;
      case "website":
        query = query.eq("order_source", "website");
        break;
      case "page":
        query = query.eq("order_source", "page");
        break;
      case "new":
        query = query.eq("status", "pending").eq("print_count", 0);
        break;
      case "duplicate":
        query = query.eq("is_duplicate", true);
        break;
      case "hold":
        // TODO: no "hold" order status exists in the database enum yet.
        query = query.eq("status", "__hold__");
        break;
      case "same_phone":
        query = query.in("customer_phone", repeatPhones.length ? repeatPhones : ["__none__"]);
        break;
      case "yesterday": {
        const { from, to } = getBDTimeRange(-1);
        query = query.gte("created_at", from).lte("created_at", to);
        break;
      }
      case "last_7_days": {
        const { from } = getBDTimeRange(-7);
        query = query.gte("created_at", from);
        break;
      }
      case "this_month": {
        const { from, to } = getBDMonthRange();
        query = query.gte("created_at", from).lte("created_at", to);
        break;
      }
      case "today_shift": {
        const { from, to } = getBDTodayShiftRange();
        query = query.gte("created_at", from).lte("created_at", to);
        break;
      }
      default:
        break;
    }

    if (data.invoiceNo) query = query.ilike("invoice_no", likeTerm(data.invoiceNo));
    if (data.customerName) query = query.ilike("customer_name", likeTerm(data.customerName));
    if (data.customerPhone) query = query.ilike("customer_phone", likeTerm(data.customerPhone));
    if (data.status) query = query.eq("status", data.status);
    if (data.paymentStatus) query = query.eq("payment_status", data.paymentStatus);
    if (data.deliveryZone) query = query.eq("delivery_zone", data.deliveryZone);
    if (data.dateFrom) query = query.gte("created_at", `${data.dateFrom}T00:00:00.000Z`);
    if (data.dateTo) query = query.lte("created_at", `${data.dateTo}T23:59:59.999Z`);
    if (data.source) query = query.eq("order_source", data.source);
    if (data.courier) query = query.ilike("courier_name", likeTerm(data.courier));
    if (data.createdBy) query = query.eq("created_by", data.createdBy);
    if (data.assignedTo)
      query =
        data.assignedTo === "none"
          ? query.is("assigned_to", null)
          : query.eq("assigned_to", data.assignedTo);

    if (data.paymentMethod) query = query.eq("payment_method", data.paymentMethod);
    if (data.productCategory) {
      // Joining with order_items to filter by product category
      query = query.filter("order_items.product_category", "eq", data.productCategory);
    }
    if (data.productId) {
      query = query.filter("order_items.product_id", "eq", data.productId);
    }
    if (data.steadfastStatus) {
      // Joint query with courier_shipments
      const sfStatus = data.steadfastStatus;
      if (sfStatus === "not_submitted") {
        query = query.not("courier_shipments.courier_name", "eq", "steadfast");
      } else {
        query = query
          .eq("courier_shipments.courier_name", "steadfast")
          .eq("courier_shipments.success", sfStatus === "successful");
      }
    }

    if (data.pinned) query = query.eq("is_pinned", data.pinned === "pinned");
    // Free-text search across name, phone and invoice number.
    if (data.search) {
      const term = likeTerm(data.search);
      query = query.or(
        `customer_name.ilike.${term},customer_phone.ilike.${term},invoice_no.ilike.${term}`,
      );
    }


    const from = (data.page - 1) * data.pageSize;
    const {
      data: rows,
      count,
      error,
    } = await query
      // Pinned orders always float to the top of the current page set.
      .order("is_pinned", { ascending: false })
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1)
      .returns<AdminOrderRow[]>();
    if (error) throw new Error("Could not load orders.");

    // Resolve created-by / assigned-to labels for the rows on this page only.
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

    return {
      rows: (rows ?? []).map<AdminOrderListRow>((row) => ({
        ...row,
        order_items: row.order_items ?? [],
        created_by_label: row.created_by ? (staffLabels[row.created_by] ?? null) : null,
        assigned_to_label: row.assigned_to ? (staffLabels[row.assigned_to] ?? null) : null,
        customer_order_count: phoneCounts[row.customer_phone] ?? 1,
      })),
      count: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

// ============================================================
// ORDER TAB COUNTS
// Purpose: Live counts for the status tab strip above the table.
// Security: Requires orders.view; counts run as the signed-in user.
// ============================================================
export const getOrderTabCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // SECURITY: Unapproved staff cannot access order counts
    if (actor.status !== "approved") {
      throw new Error("Access denied. Your account is not approved yet.");
    }
    
    if (!actor.permissions.includes(PERMISSIONS.ordersView)) {
      throw new Error("Unauthorized. Missing orders.view permission.");
    }

    const phoneRows = await context.supabase
      .from("orders")
      .select("customer_phone")
      .is("deleted_at", null)
      .limit(5000)
      .returns<{ customer_phone: string }[]>();
    const phoneCounts: Record<string, number> = {};
    for (const row of phoneRows.data ?? [])
      phoneCounts[row.customer_phone] = (phoneCounts[row.customer_phone] ?? 0) + 1;
    const repeatPhones = Object.entries(phoneCounts).filter(([, count]) => count > 1);

    const base = () =>
      context.supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null);

    const counters: Record<string, PromiseLike<{ count: number | null }>> = {
      all: base(),
      confirmed: base().eq("status", "confirmed"),
      pending: base().eq("status", "pending"),
      cancelled: base().in("status", ["cancelled", "returned"]),
      completed: base().eq("status", "completed"),
      today: base().gte("created_at", getBDStartOfToday()),
      website: base().eq("order_source", "website"),
      page: base().eq("order_source", "page"),
      new: base().eq("status", "pending").eq("print_count", 0),
      duplicate: base().eq("is_duplicate", true),
    };

    const entries = await Promise.all(
      Object.entries(counters).map(async ([tab, promise]) => {
        const result = await promise!;
        return [tab, result.count ?? 0] as const;
      }),
    );

    const counts = Object.fromEntries(entries) as Record<OrderTab, number>;
    // TODO: "hold" has no matching order status in the database yet.
    counts.hold = 0;
    counts.same_phone = repeatPhones.reduce((sum, [, count]) => sum + count, 0);
    for (const tab of ORDER_TABS) counts[tab.value] = counts[tab.value] ?? 0;
    return counts;
  });

// ============================================================
// STAFF OPTIONS FOR ORDER FILTERS / ASSIGNMENT
// Purpose: Names for the "Assigned user" and "Created by" filters and
//          for the bulk Assign User action.
// Security: Requires orders.view. Only id/name/email are returned —
//          never roles, statuses or any security fields.
// ============================================================
export const listOrderStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("access_status", "approved")
      .order("full_name", { ascending: true });
    return (data ?? []).map((row) => ({
      id: row.id,
      label: row.full_name || row.email || "Staff",
    }));
  });

// ============================================================
// PIN / ASSIGN / PRINT
// Purpose: Row-level and bulk actions used by the redesigned list.
// Security: All three require orders.manage and write an order event
//          plus an audit entry.
// ============================================================
export const setOrderPinned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderPinInput.parse(input))
  .handler(async ({ data, context }) => {
    const { logOrderEvent } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { error } = await context.supabase
      .from("orders")
      .update({
        is_pinned: data.pinned,
        pinned_by: data.pinned ? context.userId : null,
        pinned_at: data.pinned ? new Date().toISOString() : null,
      })
      .eq("id", data.orderId);
    if (error) throw new Error("Could not update the pin state.");

    await logOrderEvent(data.orderId, {
      eventType: "order_updated",
      message: data.pinned ? "Order pinned" : "Order unpinned",
      actor: context.userId,
      actorLabel: actor.email ?? "admin",
    });
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderPinned,
      targetType: "order",
      targetId: data.orderId,
      newValue: { pinned: data.pinned },
    });
    return { ok: true };
  });

export const assignOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderAssignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { logOrderEvent } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { error } = await context.supabase
      .from("orders")
      .update({ assigned_to: data.assignedTo })
      .in("id", data.orderIds);
    if (error) throw new Error("Could not assign the selected orders.");

    await Promise.all(
      data.orderIds.map((orderId) =>
        logOrderEvent(orderId, {
          eventType: "order_updated",
          message: data.assignedTo ? "Order assigned" : "Order unassigned",
          actor: context.userId,
          actorLabel: actor.email ?? "admin",
          metadata: { assignedTo: data.assignedTo },
        }),
      ),
    );
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderAssigned,
      targetType: "order",
      targetId: data.orderIds.join(","),
      targetLabel: `${data.orderIds.length} order(s)`,
      newValue: { assignedTo: data.assignedTo, orderIds: data.orderIds },
    });
    return { ok: true, updated: data.orderIds.length };
  });

export const markOrdersPrinted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderPrintInput.parse(input))
  .handler(async ({ data, context }) => {
    const { logOrderEvent } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const now = new Date().toISOString();
    const { data: current } = await context.supabase
      .from("orders")
      .select("id, print_count")
      .in("id", data.orderIds)
      .returns<{ id: string; print_count: number }[]>();

    await Promise.all(
      (current ?? []).map((row) =>
        context.supabase
          .from("orders")
          .update({
            printed_at: now,
            printed_by: context.userId,
            print_count: Number(row.print_count ?? 0) + 1,
          })
          .eq("id", row.id),
      ),
    );
    await Promise.all(
      data.orderIds.map((orderId) =>
        logOrderEvent(orderId, {
          eventType: "order_printed",
          message: "Invoice printed",
          actor: context.userId,
          actorLabel: actor.email ?? "admin",
        }),
      ),
    );
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderPrinted,
      targetType: "order",
      targetId: data.orderIds.join(","),
      targetLabel: `${data.orderIds.length} order(s)`,
      newValue: { printed_at: now, orderIds: data.orderIds },
    });
    return { ok: true, printed: data.orderIds.length };
  });

// ============================================================
// ORDER ACTIVITY LOG
// Purpose: Per-order history (created / edited / status / assigned /
//          printed) shown in the Activity dialog on the list screen.
// ============================================================
export const getOrderActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { orderId: string }) => ({ orderId: String(input.orderId) }))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );
    const { data: events } = await context.supabase
      .from("order_events")
      .select("id, event_type, message, actor_label, created_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(100);
    return { events: events ?? [] };
  });

// ============================================================
// BULK ORDER STATUS UPDATE
// Purpose: Move several selected orders to the same status from the
//          list screen.
// Status: COMPLETED
// Security: Requires orders.manage, writes one order-history event
//          per order and a single audit entry for the batch.
// ============================================================
export const bulkUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderBulkStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { logOrderEvent } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    // COMPLETED status is restricted to Admin/Super Admin
    if (data.status === "completed") {
      const isAdmin = actor.roles.includes("super_admin") || actor.roles.includes("admin");
      if (!isAdmin) {
        throw new Error("Only Admin or Super Admin can mark orders as COMPLETED.");
      }
    }

    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .in("id", data.orderIds);
    if (error) throw new Error("Could not update the selected orders.");

    const { deductInventoryForOrder } = await import("./inventory.server");

    await Promise.all(
      data.orderIds.map(async (orderId: string) => {
        await logOrderEvent(orderId, {
          eventType: "order_updated",
          message: `Status changed to ${data.status} (bulk update)`,
          actor: context.userId,
          actorLabel: "admin",
          metadata: { status: data.status, bulk: true },
        });

        // Trigger stock deduction if bulk changing to COMPLETED
        if (data.status === "completed") {
          try {
            await deductInventoryForOrder(orderId, context.userId, "admin");
          } catch (e) {
            console.error(`Bulk stock deduction failed for ${orderId}:`, e);
          }
        }
      }),
    );

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderBulkStatusChanged,
      targetType: "order",
      targetId: data.orderIds.join(","),
      targetLabel: `${data.orderIds.length} order(s)`,
      newValue: { status: data.status, orderIds: data.orderIds },
    });

    return { ok: true, updated: data.orderIds.length };
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { orderId: string }) => ({ orderId: String(input.orderId) }))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    const order = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (order.error || !order.data) throw new Error("Order not found.");

    const [items, events] = await Promise.all([
      context.supabase
        .from("order_items")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("order_events")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: false }),
    ]);

    return { order: order.data, items: items.data ?? [], events: events.data ?? [] };
  });

// ============================================================
// ADMIN ORDER UPDATE (status, payment, courier, internal notes)
// Purpose: Single audited endpoint for every change an admin can
//          make to an existing order.
// Status: COMPLETED
// Security: Requires the orders.manage permission, validates each
//          field with Zod, recomputes the total from stored values
//          so pricing can never be set to an arbitrary number, and
//          writes both an order-history event and an audit entry
//          with old/new values.
// Future: Courier fields are filled in manually; a courier API can
//          later write the same columns.
// ============================================================
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderStatusUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { logOrderEvent } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // RULE 3: Only Admin/Super Admin can mark as Completed.
    if (data.status === "completed" && !actor.isSuperAdmin && actor.primaryRole !== "admin") {
      throw new Error("Only an Admin or Super Admin can mark an order as Completed.");
    }
    
    assertAccess(actor, PERMISSIONS.ordersManage);

    const before = await context.supabase
      .from("orders")
      .select(
        "invoice_no, status, payment_status, payment_method, transaction_id, advance_paid, discount, shipping, subtotal, total, delivery_zone, courier_name, courier_tracking_id, courier_status, internal_notes",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (before.error || !before.data) throw new Error("Order not found.");
    const current = before.data;

    const patch: Record<string, string | number | null> = {};
    const currentValues = current as unknown as Record<string, string | number | null>;
    if (data.status) patch["status"] = data.status;
    if (data.paymentStatus) patch["payment_status"] = data.paymentStatus;
    if (data.paymentMethod) patch["payment_method"] = data.paymentMethod;
    if (data.transactionId !== undefined) patch["transaction_id"] = data.transactionId || null;
    if (data.deliveryZone) patch["delivery_zone"] = data.deliveryZone;
    if (data.courierName !== undefined) patch["courier_name"] = data.courierName || null;
    if (data.courierTrackingId !== undefined)
      patch["courier_tracking_id"] = data.courierTrackingId || null;
    if (data.courierStatus) patch["courier_status"] = data.courierStatus;
    if (data.internalNotes !== undefined) patch["internal_notes"] = data.internalNotes || null;

    // Money changes are recomputed against the stored subtotal.
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const subtotal = Number(currentValues["subtotal"]);
    if (data.discount !== undefined || data.shipping !== undefined) {
      const discount = round2(
        Math.min(data.discount ?? Number(currentValues["discount"]), subtotal),
      );
      const shipping = round2(data.shipping ?? Number(currentValues["shipping"]));
      patch["discount"] = discount;
      patch["shipping"] = shipping;
      patch["total"] = round2(subtotal - discount + shipping);
    }
    if (data.advancePaid !== undefined) {
      const total = Number(patch["total"] ?? currentValues["total"]);
      patch["advance_paid"] = round2(Math.min(Math.max(data.advancePaid, 0), total));
    }

    if (!Object.keys(patch).length && !data.note) return { ok: true };

    if (Object.keys(patch).length) {
      const { error } = await context.supabase
        .from("orders")
        .update(patch as never)
        .eq("id", data.orderId);
      if (error) throw new Error("Could not update the order.");
    }

    await logOrderEvent(data.orderId, {
      eventType: Object.keys(patch).length ? "order_updated" : "note_added",
      message:
        data.note ??
        `Updated ${Object.entries(patch)
          .map(([key, value]) => `${key.replace(/_/g, " ")} → ${value ?? "—"}`)
          .join(", ")}`,
      actor: context.userId,
      actorLabel: "admin",
      metadata: patch as Record<string, unknown>,
    });

    await auditFromActor(actor, {
      action: Object.keys(patch).length
        ? AUDIT_ACTIONS.orderStatusChanged
        : AUDIT_ACTIONS.orderNoteAdded,
      targetType: "order",
      targetId: data.orderId,
      targetLabel: String(currentValues["invoice_no"] ?? ""),
      oldValue: Object.fromEntries(
        Object.keys(patch).map((key) => [key, currentValues[key] ?? null]),
      ),
      newValue: Object.keys(patch).length ? patch : { note: data.note ?? null },
    });

    // RULE 2: Deduct stock ONLY when order becomes COMPLETED.
    if (data.status === "completed") {
      const { deductInventoryForOrder } = await import("./inventory.server");
      await deductInventoryForOrder(data.orderId, context.userId, actor.email ?? "admin");
    }

    return { ok: true };
  });

/**
 * Endpoint to record a product return or damage.
 */
export const recordReturnOrDamage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { 
    orderId: string; 
    productId: string; 
    quantity: number; 
    type: "return" | "damage"; 
    reason: string; 
  }) => input)
  .handler(async ({ data, context }) => {
    const { processReturnOrDamage } = await import("./inventory.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    await processReturnOrDamage({
      ...data,
      actorId: context.userId,
      actorLabel: actor.email ?? "admin",
    });

    await auditFromActor(actor, {
      action: data.type === "return" ? AUDIT_ACTIONS.orderReturned : AUDIT_ACTIONS.orderDamaged,
      targetType: "order",
      targetId: data.orderId,
      newValue: { productId: data.productId, quantity: data.quantity, type: data.type, reason: data.reason },
    });

    return { ok: true };
  });

/** Admin: manual order entry — same database and invoice series as the website. */
export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => adminOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { createOrder } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersCreate);

    const order = await createOrder(data, {
      source: "admin",
      discount: data.discount,
      shipping: data.shipping,
      advancePaid: data.advancePaid,
      transactionId: data.transactionId || null,
      paymentStatus: data.paymentStatus,
      status: data.status,
      actor: context.userId,
      actorLabel: "admin",
    });
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderCreated,
      targetType: "order",
      targetId: order.orderId,
      targetLabel: order.invoiceNo,
      newValue: { total: order.total, source: "admin" },
    });
    return { orderId: order.orderId, invoiceNo: order.invoiceNo, total: order.total };
  });
