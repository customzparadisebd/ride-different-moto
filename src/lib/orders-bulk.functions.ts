// src/lib/orders-bulk.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const getOrderBulkSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({ orderIds: z.array(z.string().uuid()) }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(await resolveActor(context.userId, context.claims as never), PERMISSIONS.ordersView);
    
    const { data: rows, error } = await context.supabase
      .from("orders")
      .select("id, total, status")
      .in("id", data.orderIds);
    if (error) throw new Error(error.message);
    return rows;
  });
