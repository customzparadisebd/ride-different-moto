// ============================================================
// ORDER RECYCLE BIN ENDPOINTS
// Purpose: Soft delete, restore and (Super Admin only) permanently
//          delete orders, so a mis-click never destroys sales data.
// Status: COMPLETED
// Security: Soft delete/restore requires orders.manage; permanent
//          delete is Super Admin only, requires typing the invoice
//          number, and every action is written to the audit log.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import { orderPurgeInput, orderRecycleInput, orderRestoreInput } from "./orders.shared";

export const recycleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderRecycleInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { logOrderEvent } = await import("./orders.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { data: existing, error: readError } = await context.supabase
      .from("orders")
      .select("id, invoice_no, deleted_at")
      .eq("id", data.id)
      .maybeSingle();
    if (readError || !existing) throw new Error("Order not found.");
    if (existing.deleted_at) return { ok: true, alreadyDeleted: true };

    const { error } = await context.supabase
      .from("orders")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: context.userId,
        delete_reason: data.reason || null,
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not move the order to the Recycle Bin.");

    await logOrderEvent(data.id, {
      eventType: "recycled",
      message: data.reason ? `Moved to Recycle Bin: ${data.reason}` : "Moved to Recycle Bin",
      actorLabel: actor.email ?? "staff",
    });
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderRecycled,
      targetType: "order",
      targetId: data.id,
      targetLabel: existing.invoice_no,
      newValue: { reason: data.reason ?? null },
    });
    return { ok: true, alreadyDeleted: false };
  });

export const restoreOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderRestoreInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const { logOrderEvent } = await import("./orders.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { data: existing } = await context.supabase
      .from("orders")
      .select("id, invoice_no")
      .eq("id", data.id)
      .maybeSingle();
    if (!existing) throw new Error("Order not found.");

    const { error } = await context.supabase
      .from("orders")
      .update({ deleted_at: null, deleted_by: null, delete_reason: null })
      .eq("id", data.id);
    if (error) throw new Error("Could not restore the order.");

    await logOrderEvent(data.id, {
      eventType: "restored",
      message: "Restored from Recycle Bin",
      actorLabel: actor.email ?? "staff",
    });
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderRestored,
      targetType: "order",
      targetId: data.id,
      targetLabel: existing.invoice_no,
    });
    return { ok: true };
  });

export const purgeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderPurgeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    if (!actor.isSuperAdmin) {
      throw new Error("Only a Super Admin can permanently delete an order.");
    }

    const { data: existing } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .not("deleted_at", "is", null)
      .maybeSingle();
    if (!existing) throw new Error("Order not found in the Recycle Bin.");
    if (existing.invoice_no !== data.confirmInvoiceNo) {
      throw new Error("The invoice number you typed does not match.");
    }

    const { error } = await context.supabase.from("orders").delete().eq("id", data.id);
    if (error) throw new Error("Could not permanently delete the order.");

    // Keep a full copy of the destroyed record in the append-only audit log.
    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.orderPurged,
      targetType: "order",
      targetId: data.id,
      targetLabel: existing.invoice_no,
      oldValue: existing,
    });
    return { ok: true };
  });
