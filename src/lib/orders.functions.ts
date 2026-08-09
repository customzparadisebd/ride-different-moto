import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  adminOrderInput,
  checkoutSubmitInput,
  orderStatusUpdateInput,
  SHIPPING_FLAT_BDT,
} from "./orders.shared";

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

/** Admin: does the signed-in account have staff access? */
export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureAccount } = await import("./orders.server");
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const roles = await ensureAccount(context.userId, email);
    return { userId: context.userId, email, roles, isStaff: roles.length > 0 };
  });

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./orders.server");
    await assertStaff(context.supabase, context.userId);

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
    const { assertStaff } = await import("./orders.server");
    await assertStaff(context.supabase, context.userId);

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
    const { assertStaff, logOrderEvent } = await import("./orders.server");
    await assertStaff(context.supabase, context.userId);

    const patch: Record<string, string> = {};
    if (data.status) patch["status"] = data.status;
    if (data.paymentStatus) patch["payment_status"] = data.paymentStatus;
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

    return { ok: true };
  });

/** Admin: manual order entry — same database and invoice series as the website. */
export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adminOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff, createOrder } = await import("./orders.server");
    await assertStaff(context.supabase, context.userId);

    const order = await createOrder(data, {
      source: "admin",
      discount: data.discount,
      shipping: data.shipping,
      paymentStatus: data.paymentStatus,
      status: data.status,
      actor: context.userId,
      actorLabel: "admin",
    });
    return { orderId: order.orderId, invoiceNo: order.invoiceNo, total: order.total };
  });