// ============================================================
// INVOICE SETTINGS ENDPOINTS
// Purpose: Manage invoice prefix and sequence starting number.
// Security: Requires Admin or Super Admin role.
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  DEFAULT_INVOICE_SETTINGS,
  invoiceSettingsInput,
  type InvoiceSettings,
} from "./invoicing.shared";

/** Admin: Fetches current invoice prefix and starting number. */
export const getInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InvoiceSettings & { currentNumber: number; nextNumber: number }> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersView);

    const { data, error } = await context.supabase
      .from("invoice_settings")
      .select("prefix, start_number, current_number")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_INVOICE_SETTINGS, currentNumber: 0, nextNumber: 1 };
    }

    return {
      prefix: data.prefix,
      startNumber: data.start_number,
      currentNumber: data.current_number,
      nextNumber: Math.max(data.start_number, data.current_number + 1),
    };
  });

/** Admin: Updates the invoice prefix and/or starting number. */
export const saveInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => invoiceSettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    
    // REQUIRE ADMIN FOR RESETTING SERIALS
    assertAccess(actor, PERMISSIONS.ordersManage);

    const { data: before } = await context.supabase
      .from("invoice_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    // If nextNumber is provided, we adjust current_number so the trigger picks up the correct next value.
    // The trigger logic uses: GREATEST(start_number, current_number + 1)
    // To force NEXT to be X, we set current_number to X - 1 and start_number to 1.
    // We also verify that the new invoice ID will not conflict with an existing one.
    const nextVal = data.nextNumber !== undefined ? data.nextNumber : data.currentNumber + 1;
    const testInvoiceNo = `${data.prefix}-${nextVal < 10 ? nextVal.toString().padStart(2, '0') : nextVal}`;
    
    const { data: exists } = await context.supabase
      .from("orders")
      .select("id")
      .eq("invoice_no", testInvoiceNo)
      .maybeSingle();

    if (exists) {
      throw new Error(`Conflict: Invoice ${testInvoiceNo} already exists. Please choose a different starting number.`);
    }

    const updates = {
      prefix: data.prefix,
      start_number: 1, // Always allow sequence to start from where we set it
      current_number: data.nextNumber !== undefined ? data.nextNumber - 1 : data.currentNumber,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    };

    const { error } = await context.supabase
      .from("invoice_settings")
      .update(updates)
      .eq("id", "default");

    if (error) throw new Error("Could not save invoice settings.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.invoiceSettingsUpdated,
      targetType: "invoice_settings",
      targetId: "default",
      targetLabel: "Invoice Settings",
      oldValue: (before ?? null) as never,
      newValue: { ...data, ...updates } as never,
    });

    return { ok: true };
  });
