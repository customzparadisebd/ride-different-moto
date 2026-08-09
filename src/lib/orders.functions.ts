import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  adminOrderInput,
  checkoutSubmitInput,
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

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, invoice_no, customer_name, customer_phone, city, total, status, payment_status, payment_method, order_source, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Could not load orders.");
    return data;
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
      .select("invoice_no, status, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    const patch: { status?: string; payment_status?: string } = {};
    if (data.status) patch.status = data.status;
    if (data.paymentStatus) patch.payment_status = data.paymentStatus;
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
          .map(([key, value]) => `${key.replace("_", " ")} → ${value}`)
          .join(", ")}`,
      actor: context.userId,
      actorLabel: "admin",
      metadata: patch,
    });

    await auditFromActor(actor, {
      action: Object.keys(patch).length
        ? AUDIT_ACTIONS.orderStatusChanged
        : AUDIT_ACTIONS.orderNoteAdded,
      targetType: "order",
      targetId: data.orderId,
      targetLabel: before.data?.invoice_no ?? null,
      oldValue: before.data
        ? { status: before.data.status, payment_status: before.data.payment_status }
        : null,
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