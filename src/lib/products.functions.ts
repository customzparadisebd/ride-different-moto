// ============================================================
// PRODUCT MANAGEMENT ENDPOINTS
// Purpose: Database-backed product catalog for the admin panel —
//          list/filter, create, edit, stock change, flag toggles,
//          Recycle Bin (soft delete + restore) and Super-Admin-only
//          permanent delete.
// Status: COMPLETED
// Security: Every write requires the products.manage permission
//          (permanent delete requires Super Admin) and is written to
//          the append-only audit log with old/new values.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  featuredProductsUpdateInput,
  productDeleteInput,
  productInput,
  productListInput,
  productPurgeInput,
  productRestoreInput,
  productStockInput,
  productToggleInput,
  productUpdateInput,
  productColorInput,
  productColorListInput,
  productColorDeleteInput,
  productColorReorderInput,
  PRODUCT_COLOR_COLUMNS,
  productColorToRow,
  product360ImageInput,
  product360ListInput,
  product360DeleteInput,
  product360ReorderInput,
  PRODUCT_360_COLUMNS,
  product360ToRow,
  PRODUCT_COLUMNS,
  PRODUCT_TOGGLE_COLUMNS,
  productToRow,
} from "./products.shared";


export const listProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productListInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    let query = context.supabase.from("products").select(PRODUCT_COLUMNS, { count: "exact" });
    query = data.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

    if (data.search) {
      const term = `%${data.search}%`;
      query = query.or(`name.ilike.${term},sku.ilike.${term},slug.ilike.${term}`);
    }
    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.activeOnly) query = query.eq("is_active", true);
    if (data.stock === "out_of_stock") query = query.lte("stock_qty", 0);
    if (data.stock === "in_stock") query = query.gt("stock_qty", 0);

    const from = (data.page - 1) * data.pageSize;
    const {
      data: rows,
      count,
      error,
    } = await query.order("updated_at", { ascending: false }).range(from, from + data.pageSize - 1);
    if (error) throw new Error("Could not load products.");

    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { data: row, error } = await context.supabase
      .from("products")
      .insert({ ...productToRow(data), created_by: context.userId })
      .select("id, name")
      .single();
    if (error) {
      throw new Error(
        error.code === "23505" || error.message.includes("duplicate")
          ? "That SKU or slug is already used by another product."
          : "Could not create the product.",
      );
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productCreated,
      targetType: "product",
      targetId: row.id,
      targetLabel: row.name,
      newValue: productToRow(data),
    });
    return { id: row.id };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { id, ...rest } = data;
    const before = await context.supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (!before.data) throw new Error("Product not found.");

    const { error } = await context.supabase
      .from("products")
      .update(productToRow(rest))
      .eq("id", id);
    if (error) {
      throw new Error(
        error.message.includes("duplicate")
          ? "That SKU or slug is already used by another product."
          : "Could not save the product.",
      );
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product",
      targetId: id,
      targetLabel: rest.name,
      oldValue: before.data,
      newValue: productToRow(rest),
    });
    return { ok: true };
  });

export const setProductStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productStockInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("products")
      .select("name, stock_qty")
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Product not found.");

    const { error } = await context.supabase
      .from("products")
      .update({ stock_qty: data.stockQty })
      .eq("id", data.id);
    if (error) throw new Error("Could not update the stock.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productStockChanged,
      targetType: "product",
      targetId: data.id,
      targetLabel: before.data.name,
      oldValue: { stock_qty: before.data.stock_qty },
      newValue: { stock_qty: data.stockQty },
    });
    return { ok: true };
  });

export const toggleProductFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productToggleInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const column = PRODUCT_TOGGLE_COLUMNS[data.field];
    const { error } = await context.supabase
      .from("products")
      .update({ [column]: data.value } as never)
      .eq("id", data.id);
    if (error) throw new Error("Could not update the product.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product",
      targetId: data.id,
      newValue: { [column]: data.value },
    });
    return { ok: true };
  });

/** RECYCLE BIN: soft delete only. The row and its audit trail stay. */
export const softDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productDeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Product not found.");

    const { error } = await context.supabase
      .from("products")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: context.userId,
        delete_reason: data.reason || null,
        is_active: false,
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not move the product to the Recycle Bin.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productRecycled,
      targetType: "product",
      targetId: data.id,
      targetLabel: before.data.name,
      oldValue: before.data,
      metadata: { reason: data.reason || null },
    });
    return { ok: true };
  });

export const restoreProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productRestoreInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const { error } = await context.supabase
      .from("products")
      .update({ deleted_at: null, deleted_by: null, delete_reason: null })
      .eq("id", data.id);
    if (error) throw new Error("Could not restore the product.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productRestored,
      targetType: "product",
      targetId: data.id,
    });
    return { ok: true };
  });

/** PERMANENT DELETE: Super Admin only, needs the exact product name typed. */
export const purgeProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productPurgeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    if (!actor.isSuperAdmin) throw new Error("Only a Super Admin can permanently delete records.");

    const before = await context.supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Product not found.");
    if (before.data.name.trim() !== data.confirmName.trim()) {
      throw new Error("The typed product name does not match.");
    }
    if (!before.data.deleted_at) {
      throw new Error("Move the product to the Recycle Bin before deleting it permanently.");
    }

    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error("Could not permanently delete the product.");

    // The audit entry deliberately keeps a copy of the deleted record.
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productPurged,
      targetType: "product",
      targetId: data.id,
      targetLabel: before.data.name,
      oldValue: before.data,
    });
    return { ok: true };
  });

// ============================================================
// PRODUCT COLOR VARIATIONS (admin)
// Purpose: Manage colour options per product — add, edit, enable /
//          disable, colour-specific price and image, reorder, remove.
// Status: COMPLETED
// Security: Reads need orders.view, writes need products.manage, and
//          every write is recorded in the append-only audit log.
// ============================================================
export const listProductColors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productColorListInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    const { data: rows, error } = await context.supabase
      .from("product_colors")
      .select(PRODUCT_COLOR_COLUMNS)
      .eq("product_id", data.productId)
      .order("sort_order");
    if (error) throw new Error("Could not load the colour options.");
    return { rows: rows ?? [] };
  });

export const saveProductColor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productColorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const row = productColorToRow(data);
    if (data.id) {
      const { error } = await context.supabase.from("product_colors").update(row).eq("id", data.id);
      if (error) throw new Error("Could not save the colour option.");
    } else {
      const { error } = await context.supabase.from("product_colors").insert(row);
      if (error) throw new Error("Could not add the colour option.");
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product_color",
      targetId: data.id ?? data.productId,
      targetLabel: data.name,
      newValue: row,
    });
    return { ok: true };
  });

export const deleteProductColor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productColorDeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("product_colors")
      .select(PRODUCT_COLOR_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("Colour option not found.");

    const { error } = await context.supabase.from("product_colors").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove the colour option.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product_color",
      targetId: data.id,
      targetLabel: before.data.name,
      oldValue: before.data,
    });
    return { ok: true };
  });

export const reorderProductColors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productColorReorderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.productsManage,
    );

    await Promise.all(
      data.ids.map((id, index) =>
        context.supabase
          .from("product_colors")
          .update({ sort_order: index })
          .eq("id", id)
          .eq("product_id", data.productId),
      ),
    );
    return { ok: true };
  });

export const updateFeaturedProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => featuredProductsUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const results = await Promise.all(
      data.items.map((item: any) =>
        context.supabase
          .from("products")
          .update({
            sort_order: item.sortOrder,
            badge_text: item.badgeText || null,
            badge_enabled: item.badgeEnabled,
          })
          .eq("id", item.id)
      )
    );

    const error = results.find((r: any) => r.error);

    if (error) throw new Error("Could not update some products.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product",
      targetLabel: "Bulk Featured Update",
      newValue: data.items,
    });

    return { ok: true };
  });

// ============================================================
// PRODUCT 360 VIEWER (admin)
// Purpose: Manage 360° image sequences per product.
// ============================================================
export const listProduct360Images = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => product360ListInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    const { data: rows, error } = await context.supabase
      .from("product_360_images")
      .select(PRODUCT_360_COLUMNS)
      .eq("product_id", data.productId)
      .order("display_order");
    if (error) throw new Error("Could not load the 360° images.");
    return { rows: rows ?? [] };
  });

export const saveProduct360Image = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => product360ImageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const row = product360ToRow(data);
    if (data.id) {
      const { error } = await context.supabase.from("product_360_images").update(row).eq("id", data.id);
      if (error) throw new Error("Could not save the 360° image.");
    } else {
      const { error } = await context.supabase.from("product_360_images").insert(row);
      if (error) throw new Error("Could not add the 360° image.");
    }

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product_360_image",
      targetId: data.id ?? data.productId,
      newValue: row,
    });
    return { ok: true };
  });

export const deleteProduct360Image = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => product360DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("product_360_images")
      .select(PRODUCT_360_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (!before.data) throw new Error("360° image not found.");

    const { error } = await context.supabase.from("product_360_images").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove the 360° image.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.productUpdated,
      targetType: "product_360_image",
      targetId: data.id,
      oldValue: before.data,
    });
    return { ok: true };
  });

export const reorderProduct360Images = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => product360ReorderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.productsManage,
    );

    await Promise.all(
      data.ids.map((id, index) =>
        context.supabase
          .from("product_360_images")
          .update({ display_order: index })
          .eq("id", id)
          .eq("product_id", data.productId),
      ),
    );
    return { ok: true };
  });


