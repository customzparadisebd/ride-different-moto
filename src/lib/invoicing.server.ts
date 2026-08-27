import {
  DEFAULT_INVOICE_SETTINGS,
  formatInvoiceNo,
  type InvoiceSettingsState,
} from "./invoicing.shared";

type InvoiceSettingsClient = { from: (table: string) => any };

export function buildInvoiceSettingsUpdate(
  prefix: string,
  actorId: string,
  nextNumber?: number,
) {
  return {
    prefix,
    updated_at: new Date().toISOString(),
    updated_by: actorId,
    ...(nextNumber === undefined
      ? {}
      : { start_number: nextNumber, current_number: nextNumber - 1 }),
  };
}

export async function readInvoiceSettingsState(
  supabase: InvoiceSettingsClient,
): Promise<InvoiceSettingsState> {
  const { data } = await supabase
    .from("invoice_settings")
    .select("prefix, start_number, current_number")
    .eq("id", "default")
    .maybeSingle();

  const prefix = data?.prefix ?? DEFAULT_INVOICE_SETTINGS.prefix;
  const startNumber = data?.start_number ?? DEFAULT_INVOICE_SETTINGS.startNumber;
  const currentNumber = data?.current_number ?? DEFAULT_INVOICE_SETTINGS.currentNumber;
  const nextNumber = Math.max(startNumber, currentNumber + 1);

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
    nextInvoiceNo: formatInvoiceNo(prefix, nextNumber),
    lastInvoiceNo: (last as { invoice_no: string | null } | null)?.invoice_no ?? null,
  };
}