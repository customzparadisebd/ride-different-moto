import { formatInvoiceNo, type InvoiceSettingsState } from "./invoicing.shared";

type InvoiceSettingsClient = { from: (table: string) => any };

export async function readInvoiceSettingsState(
  supabase: InvoiceSettingsClient,
): Promise<InvoiceSettingsState> {
  const { data, error } = await supabase
    .from("invoice_settings")
    .select("prefix, start_number, current_number, updated_at")
    .eq("id", "default")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Invoice settings missing");

  const prefix = String(data.prefix);
  const startNumber = Number(data.start_number);
  const currentNumber = Number(data.current_number);
  const nextNumber = Math.max(startNumber, currentNumber + 1);

  return {
    prefix,
    startNumber,
    currentNumber,
    currentInvoiceNo: currentNumber > 0 ? formatInvoiceNo(prefix, currentNumber) : null,
    nextNumber,
    nextInvoiceNo: formatInvoiceNo(prefix, nextNumber),
    updatedAt: String(data.updated_at),
  };
}