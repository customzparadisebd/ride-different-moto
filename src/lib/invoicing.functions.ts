// ============================================================
// INVOICE SETTINGS ENDPOINTS
// Purpose: Manage invoice prefix and sequence starting number.
// Security: Requires Admin or Super Admin role.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import { invoiceSettingsInput, type InvoiceSettingsState } from "./invoicing.shared";
import { readInvoiceSettingsState } from "./invoicing.server";

/** Admin: Fetches current invoice prefix, sequence state and the next invoice number. */
export const getInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InvoiceSettingsState> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersView);

    return readInvoiceSettingsState(context.supabase as never);
  });

/** Admin: Updates the invoice prefix and/or the next serial, effective immediately. */
export const saveInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => invoiceSettingsInput.parse(input))
  .handler(async ({ data, context }): Promise<InvoiceSettingsState> => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);

    // REQUIRE ADMIN FOR RESETTING SERIALS
    assertAccess(actor, PERMISSIONS.ordersManage);

    const supabase = context.supabase;
    const { data: before } = await supabase
      .from("invoice_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    const prefix = data.prefix;

    // Prefix-only save: never touch the live counter (otherwise a stale form
    // value could rewind the sequence and reuse an invoice number).
    // Keep reset/manual saves atomic at the database boundary. A historical
    // counter can never be combined with the newly requested start number.
    const rpcArgs =
      data.nextNumber === undefined
        ? { p_prefix: prefix }
        : { p_prefix: prefix, p_next_number: data.nextNumber };
    const { error } = await supabase.rpc("save_invoice_settings", rpcArgs);

    if (error) throw new Error("Could not save invoice settings.");

    const state = await readInvoiceSettingsState(supabase);

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.invoiceSettingsUpdated,
      targetType: "invoice_settings",
      targetId: "default",
      targetLabel: "Invoice Settings",
      oldValue: (before ?? null) as never,
      newValue: {
        prefix: state.prefix,
        start_number: state.startNumber,
        current_number: state.currentNumber,
        nextInvoiceNo: state.nextInvoiceNo,
      } as never,
    });

    // Fresh state is returned so the admin UI updates instantly, no refetch race.
    return state;
  });
