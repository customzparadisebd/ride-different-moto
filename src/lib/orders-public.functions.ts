import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getOrderPublic = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // We use maybeSingle() to avoid throwing on not found
    const order = await supabaseAdmin
      .from("orders")
      .select(
        "id, invoice_no, total, customer_name, customer_phone, city, address_line, delivery_zone, status, payment_method, notes, created_at",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (order.error || !order.data) {
      throw new Error("Order not found or inaccessible.");
    }

    const items = await supabaseAdmin
      .from("order_items")
      .select("id, product_name, variant, unit_price, quantity, line_total")
      .eq("order_id", data.id)
      .order("created_at", { ascending: true });

    return {
      order: order.data,
      items: items.data ?? [],
    };
  });
