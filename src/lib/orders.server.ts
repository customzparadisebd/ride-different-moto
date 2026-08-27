/**
 * Server-only order logic. Never imported by client code (blocked by the
 * `.server.ts` extension) — it uses the service-role client.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { checkoutInput, type CheckoutInput } from "./orders.shared";

const ADMIN_BOOTSTRAP_EMAIL = "customzparadisebd@gmail.com";

type CreateOptions = {
  source: "website" | "admin";
  discount?: number;
  shipping?: number;
  advancePaid?: number;
  transactionId?: string | null;
  paymentStatus?: string;
  status?: string;
  actor?: string | null;
  actorLabel?: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CreatedOrder = {
  orderId: string;
  invoiceNo: string;
  total: number;
  duplicate: boolean;
  alert?: string;
};

export async function createOrder(
  raw: CheckoutInput,
  options: CreateOptions,
): Promise<CreatedOrder> {
  const input = checkoutInput.parse(raw);

  // STOCK VALIDATION
  const productIds = input.items
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));
  if (productIds.length > 0) {
    const products = await supabaseAdmin
      .from("products")
      .select("id, name, stock_qty, out_of_stock_toggle")
      .in("id", productIds);

    if (products.data) {
      for (const item of input.items) {
        const product = products.data.find((p) => p.id === item.productId);
        if (!product) continue;
        if (product.out_of_stock_toggle) {
          throw new Error(`Product "${product.name}" is currently unavailable.`);
        }
        if (product.stock_qty < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stock_qty} available.`,
          );
        }
      }
    }
  }

  // Duplicate protection: the same submit key never creates a second order.
  const existing = await supabaseAdmin
    .from("orders")
    .select("id, invoice_no, total")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing.data) {
    return {
      orderId: existing.data.id,
      invoiceNo: existing.data.invoice_no,
      total: Number(existing.data.total),
      duplicate: true,
    };
  }

  const subtotal = round2(
    input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  const discount = round2(Math.min(options.discount ?? 0, subtotal));
  const shipping = round2(options.shipping ?? 0);
  const total = round2(subtotal - discount + shipping);
  const advancePaid = round2(Math.min(options.advancePaid ?? 0, total));

  // A part payment recorded up front is reflected in the payment status, so
  // the admin list never shows "unpaid" for an order that already has cash in.
  const paymentStatus =
    options.paymentStatus ??
    (advancePaid <= 0 ? "unpaid" : advancePaid >= total ? "paid" : "partial");

  const inserted = await supabaseAdmin
    .from("orders")
    .insert({
      invoice_no: "", // Placeholder, trigger will fill it properly if it's null/empty
      idempotency_key: input.idempotencyKey,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail || null,
      address_line: input.addressLine,
      city: input.city,
      delivery_zone: input.deliveryZone,
      notes: input.notes || null,
      subtotal,
      discount,
      shipping,
      total,
      advance_paid: advancePaid,
      transaction_id: options.transactionId || null,
      payment_method: input.paymentMethod,
      payment_status: paymentStatus,
      order_source: options.source,
      status: options.status ?? "pending",
      created_by: options.actor ?? null,
    })
    .select("id, invoice_no, total")
    .single();

  if (inserted.error) {
    // Unique violation on the submit key = a racing duplicate; return the winner.
    if (inserted.error.code === "23505" && inserted.error.message.includes("idempotency_key")) {
      const winner = await supabaseAdmin
        .from("orders")
        .select("id, invoice_no, total")
        .eq("idempotency_key", input.idempotencyKey)
        .single();
      if (winner.data) {
        return {
          orderId: winner.data.id,
          invoiceNo: winner.data.invoice_no,
          total: Number(winner.data.total),
          duplicate: true,
        };
      }
    }

    throw new Error("Could not save the order. Please try again.");
  }

  const order = inserted.data;

  const items = await supabaseAdmin.from("order_items").insert(
    input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? null,
      product_slug: item.productSlug ?? null,
      product_name: item.productName,
      variant: item.variant || null,
      image_url: item.imageUrl || null,
      unit_price: round2(item.unitPrice),
      quantity: item.quantity,
      line_total: round2(item.unitPrice * item.quantity),
    })),
  );
  if (items.error) {
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    throw new Error("Could not save the order items. Please try again.");
  }

  await logOrderEvent(order.id, {
    eventType: "order_created",
    message:
      options.source === "admin"
        ? "Order created manually from the admin panel"
        : "Order placed from the website checkout",
    actor: options.actor ?? null,
    actorLabel: options.actorLabel ?? (options.source === "admin" ? "admin" : "customer"),
    metadata: { subtotal, discount, shipping, total, items: input.items.length },
  });

  return { orderId: order.id, invoiceNo: order.invoice_no, total, duplicate: false };
}

export async function logOrderEvent(
  orderId: string,
  event: {
    eventType: string;
    message?: string;
    actor?: string | null;
    actorLabel?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: event.eventType,
    message: event.message ?? null,
    actor: event.actor ?? null,
    actor_label: event.actorLabel ?? "system",
    metadata: (event.metadata ?? null) as never,
  });
}

/** Confirms the caller has a staff role. Throws otherwise. */
export async function assertStaff(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { resolveActor, assertAccess } = await import("./admin.server");
  // We don't have the claims here, but resolveActor handles null claims by looking up the profile.
  const actor = await resolveActor(userId, null);
  assertAccess(actor);
}

/**
 * Keeps a profile row for the signed-in staff account and grants the owner
 * account the admin role the first time it signs in.
 */
export async function ensureAccount(
  userId: string,
  email: string | null,
  fullName?: string | null,
) {
  await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: userId, email, full_name: fullName ?? null, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );

  if (email && email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL) {
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  }

  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((row) => row.role);
}
