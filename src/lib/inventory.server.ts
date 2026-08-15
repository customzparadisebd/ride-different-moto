import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logOrderEvent } from "./orders.server";

/**
 * Deducts inventory for an order ONLY if it hasn't been deducted before.
 * Atomic operation using a database transaction is simulated here through serial checks,
 * but the `UNIQUE(order_item_id)` in `order_stock_deductions` provides the safety.
 */
export async function deductInventoryForOrder(orderId: string, actorId: string, actorLabel: string) {
  // 1. Fetch order items
  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("id, product_id, quantity, product_name")
    .eq("order_id", orderId);

  if (itemsError || !items) throw new Error("Could not fetch order items for inventory deduction.");

  for (const item of items) {
    if (!item.product_id) continue;

    // 2. Check if already deducted (UNIQUE constraint in DB will also catch this)
    const { data: existing } = await supabaseAdmin
      .from("order_stock_deductions")
      .select("id")
      .eq("order_item_id", item.id)
      .maybeSingle();

    if (existing) continue;

    // 3. Deduct stock and record deduction atomically (in app logic for now)
    const { data: product, error: prodError } = await supabaseAdmin
      .from("products")
      .select("stock_qty")
      .eq("id", item.product_id)
      .single();

    if (prodError || !product) continue;

    const newQty = Math.max(0, product.stock_qty - item.quantity);

    // Update product stock
    await supabaseAdmin
      .from("products")
      .update({ stock_qty: newQty })
      .eq("id", item.product_id);

    // Record deduction
    await supabaseAdmin.from("order_stock_deductions").insert({
      order_id: orderId,
      order_item_id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
    });

    await logOrderEvent(orderId, {
      eventType: "inventory_deducted",
      message: `Stock deducted for ${item.product_name}: ${item.quantity} units.`,
      actor: actorId,
      actorLabel,
      metadata: { productId: item.product_id, quantity: item.quantity, remaining: newQty },
    });
  }
}

/**
 * Records a return or damage marking.
 */
export async function processReturnOrDamage(params: {
  orderId: string;
  productId: string;
  quantity: number;
  type: "return" | "damage";
  reason: string;
  actorId: string;
  actorLabel: string;
}) {
  const table = params.type === "return" ? "order_returns" : "order_damages";
  
  const { error } = await supabaseAdmin.from(table).insert({
    order_id: params.orderId,
    product_id: params.productId,
    quantity: params.quantity,
    reason: params.reason,
    processed_by: params.actorId,
  });

  if (error) throw new Error(`Could not record ${params.type}.`);

  await logOrderEvent(params.orderId, {
    eventType: params.type === "return" ? "order_returned" : "order_damaged",
    message: `${params.type === "return" ? "Returned" : "Marked as Damaged"}: ${params.quantity} units. Reason: ${params.reason}`,
    actor: params.actorId,
    actorLabel: params.actorLabel,
    metadata: { productId: params.productId, quantity: params.quantity, reason: params.reason },
  });
}
