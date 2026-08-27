// ============================================================
// ORDER HARD-DELETE HELPER (server only)
// Purpose: Permanently destroy orders and their dependent rows.
// Security: Service-role client — callers MUST authorise first.
//          The `orders` table has no DELETE policy for staff, so
//          permanent deletion can only happen through here.
// ============================================================
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Child tables that reference orders.id and must go first. */
const CHILD_TABLES = [
  "courier_tracking_events",
  "courier_api_logs",
  "courier_shipments",
  "order_stock_deductions",
  "order_damages",
  "order_returns",
  "order_items",
  "order_events",
  "payments",
] as const;

export async function hardDeleteOrders(orderIds: string[]): Promise<number> {
  if (orderIds.length === 0) return 0;

  for (const table of CHILD_TABLES) {
    await supabaseAdmin.from(table).delete().in("order_id", orderIds);
  }
  // Collisions keep a nullable reference; detach instead of deleting history.
  await supabaseAdmin
    .from("invoice_collisions")
    .update({ existing_order_id: null })
    .in("existing_order_id", orderIds);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .delete()
    .in("id", orderIds)
    .select("id");
  if (error) throw new Error(`Could not permanently delete: ${error.message}`);
  return data?.length ?? 0;
}
