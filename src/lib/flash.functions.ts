import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { flashSaleInput, type FlashSale } from "./flash.shared";
import { PERMISSIONS, AUDIT_ACTIONS } from "./admin.shared";

export const getFlashSales = createServerFn({ method: "GET" }).handler(async (): Promise<FlashSale[]> => {
    const admin = await supabaseAdmin();
    const { data, error } = await admin
    .select("*, flash_sale_products(product_id)")
    .from("flash_sales")
    .select("*, flash_sale_products(product_id)")
    .order("priority", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: row.start_time,
    endTime: row.end_time,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    isActive: row.is_active,
    priority: row.priority,
    productIds: row.flash_sale_products.map((p: any) => p.product_id),
  }));
});

export const saveFlashSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => flashSaleInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const isNew = !data.id;
    const { productIds, ...saleData } = data;

    const dbPayload = {
      name: saleData.name,
      description: saleData.description,
      start_date: saleData.startDate,
      end_date: saleData.endDate,
      start_time: saleData.startTime,
      end_time: saleData.endTime,
      discount_type: saleData.discountType,
      discount_value: saleData.discountValue,
      is_active: saleData.isActive,
      priority: saleData.priority,
      updated_at: new Date().toISOString(),
    };

    let saleId = data.id;

    if (isNew) {
      const { data: newSale, error } = await (context.supabase as any)
        .from("flash_sales")
        .insert({ ...dbPayload, created_by: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      saleId = newSale.id;
    } else {
      const { error } = await (context.supabase as any)
        .from("flash_sales")
        .update(dbPayload)
        .eq("id", saleId!);
      if (error) throw new Error(error.message);
    }

    // Sync products
    await (context.supabase as any).from("flash_sale_products").delete().eq("flash_sale_id", saleId!);
    if (productIds.length > 0) {
      const { error } = await (context.supabase as any)
        .from("flash_sale_products")
        .insert(productIds.map(pid => ({ flash_sale_id: saleId!, product_id: pid })));
      if (error) throw new Error(error.message);
    }

    await auditFromActor(actor, {
      action: isNew ? "product.created" : "product.updated",
      targetType: "flash_sales",
      targetId: saleId!,
      targetLabel: `Flash Sale: ${saleData.name}`,
      newValue: data as any,
    });

    return { id: saleId };
  });

export const deleteFlashSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: unknown) => z.string().uuid().parse(id))
  .handler(async ({ data: id, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await (context.supabase as any).from("flash_sales").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await auditFromActor(actor, {
      action: "product.deleted",
      targetType: "flash_sales",
      targetId: id,
      targetLabel: "Flash Sale Deleted",
    });

    return { ok: true };
  });
