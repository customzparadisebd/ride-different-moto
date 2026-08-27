// ============================================================
// INVOICE SETTINGS ENDPOINTS
// Purpose: Manage invoice prefix and sequence starting number.
// Security: Requires Admin or Super Admin role.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  DEFAULT_INVOICE_SETTINGS,
  formatInvoiceNo,
  invoiceSettingsInput,
  type InvoiceSettingsState,
} from "./invoicing.shared";

type Client = { from: (t: string) => any };

/**
 * Resolves the invoice number the NEXT order will actually receive.
 * Mirrors the database generator: start from GREATEST(start, current+1)
 * and skip any serial already used by an order (including soft-deleted).
 */
async function resolveNextInvoiceNo(
  supabase: Client,
  prefix: string,
  candidate: number,
): Promise<{ nextNumber: number; nextInvoiceNo: string }> {
  const { data } = await supabase
    .from("orders")
    .select("invoice_no")
    .like("invoice_no", `${prefix}-%`);

  const used = new Set<string>(
    ((data ?? []) as { invoice_no: string | null }[])
      .map((r) => r.invoice_no)
      .filter((v): v is string => Boolean(v)),
  );

  let num = Math.max(1, candidate);
  while (used.has(formatInvoiceNo(prefix, num))) num += 1;
  return { nextNumber: num, nextInvoiceNo: formatInvoiceNo(prefix, num) };
}

async function readState(supabase: Client): Promise<InvoiceSettingsState> {
  const { data } = await supabase
    .from("invoice_settings")
    .select("prefix, start_number, current_number")
    .eq("id", "default")
    .maybeSingle();

  const prefix = data?.prefix ?? DEFAULT_INVOICE_SETTINGS.prefix;
  const startNumber = data?.start_number ?? DEFAULT_INVOICE_SETTINGS.startNumber;
  const currentNumber = data?.current_number ?? 0;

  const { nextNumber, nextInvoiceNo } = await resolveNextInvoiceNo(
    supabase,
    prefix,
    Math.max(startNumber, currentNumber + 1),
  );

  const { data: last } = await supabase
    .from("orders")
    .select("invoice_no")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    prefix,
    startNumber,
    currentNumber,
    nextNumber,
    nextInvoiceNo,
    lastInvoiceNo: (last as { invoice_no: string | null } | null)?.invoice_no ?? null,
  };
}

/** Admin: Fetches current invoice prefix, sequence state and the next invoice number. */
export const getInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InvoiceSettingsState> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.ordersView);

    return readState(context.supabase as never);
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

    const supabase = context.supabase as never as Client;
    const { data: before } = await supabase
      .from("invoice_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    const prefix = data.prefix;

    // Prefix-only save: never touch the live counter (otherwise a stale form
    // value could rewind the sequence and reuse an invoice number).
    const updates: Record<string, unknown> = {
      prefix,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    };

    if (data.nextNumber !== undefined) {
      // Force the NEXT order to use exactly this serial.
      const target = formatInvoiceNo(prefix, data.nextNumber);
      const { data: exists } = await supabase
        .from("orders")
        .select("id")
        .eq("invoice_no", target)
        .maybeSingle();
      if (exists) {
        throw new Error(
          `Conflict: Invoice ${target} already exists. Please choose a different starting number.`,
        );
      }
      updates["start_number"] = data.nextNumber;
      updates["current_number"] = data.nextNumber - 1;
    }

    const { error } = await supabase
      .from("invoice_settings")
      .update(updates)
      .eq("id", "default");

    if (error) throw new Error("Could not save invoice settings.");

    const state = await readState(supabase);

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.invoiceSettingsUpdated,
      targetType: "invoice_settings",
      targetId: "default",
      targetLabel: "Invoice Settings",
      oldValue: (before ?? null) as never,
      newValue: { ...updates, nextInvoiceNo: state.nextInvoiceNo } as never,
    });

    // Fresh state is returned so the admin UI updates instantly, no refetch race.
    return state;
  });
