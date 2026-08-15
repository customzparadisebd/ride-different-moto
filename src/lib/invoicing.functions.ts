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
export const getInvoiceSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InvoiceSettings & { currentNumber: number }> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersView);

    const { data, error } = await context.supabase
      .from("invoice_settings")
      .select("prefix, start_number, current_number")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_INVOICE_SETTINGS, currentNumber: 0 };
    }

    return {
      prefix: data.prefix,
      startNumber: data.start_number,
      currentNumber: data.current_number,
    };
  });

/** Admin: Updates the invoice prefix and/or starting number. */
export const saveInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => invoiceSettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    // Only Admin/Super Admin allowed per requirements.
    assertAccess(actor, PERMISSIONS.apiManage);

    const before = await context.supabase
      .from("invoice_settings")
      .select("prefix, start_number, current_number")
      .eq("id", "default")
      .maybeSingle();

      const { error } = await context.supabase
      .from("invoice_settings")
      .update({
        prefix: data.prefix,
        start_number: data.startNumber,
        current_number: data.currentNumber - 1, // Store n-1 so next generation gives n
        updated_at: new Date().toISOString(),
        updated_by: actor.userId,
      })
      .eq("id", "default");

    if (error) throw new Error("Could not save invoice settings.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.invoiceSettingsUpdated,
      targetType: "invoice_settings",
      targetId: "default",
      targetLabel: "Invoice Settings",
      oldValue: (before.data ?? null) as never,
      newValue: data as never,
    });

    return { ok: true };
  });
