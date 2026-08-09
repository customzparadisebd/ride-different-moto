import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  adminOrderInput,
  checkoutSubmitInput,
  orderFilterInput,
  orderStatusUpdateInput,
  SHIPPING_FLAT_BDT,
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
  .inputValidator((input: unknown) => checkoutSubmitInput.parse(input))
  .handler(async ({ data }) => {
    const [{ createOrder }, { getProducts }] = await Promise.all([
      import("./orders.server"),
      import("@/data/catalog"),
    ]);

    const catalog = getProducts();
    const items = data.items.map((line) => {
      const product = catalog.find((p) => p.id === line.productId);
      if (!product || !product.inStock) {
        throw new Error("One of the products in your cart is no longer available.");
      }
      return {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        // Snapshot of what the customer saw, so admin order views keep the
        // right image and variant text even if the catalog changes later.
        imageUrl: product.image,
        variant: product.category,
        unitPrice: product.offerPrice ?? product.price,
        quantity: line.quantity,
      };
    });

    const order = await createOrder(
      { ...data, items },
      { source: "website", shipping: SHIPPING_FLAT_BDT, actorLabel: "customer" },
    );
    return { invoiceNo: order.invoiceNo, total: order.total, duplicate: order.duplicate };
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
      roles: actor.roles,
      primaryRole: actor.primaryRole,
      permissions: actor.permissions,
      status: actor.status,
      isStaff: actor.isStaff,
      isSuperAdmin: actor.isSuperAdmin,
      mfaRequired: actor.mfaRequired,
      mfaSatisfied: actor.mfaSatisfied,
      sessionRevoked: actor.sessionRevoked,
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
type AdminOrderRow = {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  delivery_zone: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  advance_paid: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  courier_status: string;
  order_source: string;
  created_at: string;
};

const sel = (columns: string): string => columns;

/** Escapes the LIKE wildcards so a search for "%" is a literal search. */
const likeTerm = (value: string) => `%${value.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

export const listOrders = createServerFn({ method: "POST" })
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
        sel(
          "id, invoice_no, customer_name, customer_phone, city, delivery_zone, subtotal, discount, shipping, advance_paid, total, status, payment_status, payment_method, courier_status, order_source, created_at",
        ),
      );

    if (data.invoiceNo) query = query.ilike("invoice_no", likeTerm(data.invoiceNo));
    if (data.customerName) query = query.ilike("customer_name", likeTerm(data.customerName));
    if (data.customerPhone) query = query.ilike("customer_phone", likeTerm(data.customerPhone));
    if (data.status) query = query.eq("status", data.status);
    if (data.paymentStatus) query = query.eq("payment_status", data.paymentStatus);
    if (data.deliveryZone) query = query.eq("delivery_zone", data.deliveryZone);
    if (data.dateFrom) query = query.gte("created_at", `${data.dateFrom}T00:00:00.000Z`);
    if (data.dateTo) query = query.lte("created_at", `${data.dateTo}T23:59:59.999Z`);

    const { data: rows, error } = await query
      .order("created_at", { ascending: false })
      .limit(data.limit)
      .returns<AdminOrderRow[]>();
    if (error) throw new Error("Could not load orders.");
    return rows ?? [];
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) => ({ orderId: String(input.orderId) }))
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
  .inputValidator((input: unknown) => orderStatusUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { logOrderEvent } = await import("./orders.server");
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
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
    if (data.status) patch.status = data.status;
    if (data.paymentStatus) patch.payment_status = data.paymentStatus;
    if (data.paymentMethod) patch.payment_method = data.paymentMethod;
    if (data.transactionId !== undefined) patch.transaction_id = data.transactionId || null;
    if (data.deliveryZone) patch.delivery_zone = data.deliveryZone;
    if (data.courierName !== undefined) patch.courier_name = data.courierName || null;
    if (data.courierTrackingId !== undefined)
      patch.courier_tracking_id = data.courierTrackingId || null;
    if (data.courierStatus) patch.courier_status = data.courierStatus;
    if (data.internalNotes !== undefined) patch.internal_notes = data.internalNotes || null;

    // Money changes are recomputed against the stored subtotal.
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const subtotal = Number(current.subtotal);
    if (data.discount !== undefined || data.shipping !== undefined) {
      const discount = round2(Math.min(data.discount ?? Number(current.discount), subtotal));
      const shipping = round2(data.shipping ?? Number(current.shipping));
      patch.discount = discount;
      patch.shipping = shipping;
      patch.total = round2(subtotal - discount + shipping);
    }
    if (data.advancePaid !== undefined) {
      const total = Number(patch.total ?? current.total);
      patch.advance_paid = round2(Math.min(Math.max(data.advancePaid, 0), total));
    }

    if (!Object.keys(patch).length && !data.note) return { ok: true };

    if (Object.keys(patch).length) {
      const { error } = await context.supabase
        .from("orders")
        .update(patch)
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
      targetLabel: current.invoice_no,
      oldValue: Object.fromEntries(
        Object.keys(patch).map((key) => [key, (current as Record<string, unknown>)[key] ?? null]),
      ),
      newValue: Object.keys(patch).length ? patch : { note: data.note ?? null },
    });

    return { ok: true };
  });

/** Admin: manual order entry — same database and invoice series as the website. */
export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adminOrderInput.parse(input))
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