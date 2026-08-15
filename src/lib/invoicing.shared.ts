// ============================================================
// INVOICE SETTINGS SHARED CONTRACT
// Purpose: Types and validation for order invoicing settings.
// ============================================================
import { z } from "zod";

export const invoiceSettingsInput = z.object({
  prefix: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform((v) => v.toUpperCase()),
  startNumber: z.number().int().min(1).max(999999),
  currentNumber: z.number().int().min(0).max(999999),
});

export type InvoiceSettings = z.infer<typeof invoiceSettingsInput>;

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: "CZP",
  startNumber: 1,
  currentNumber: 0,
};

export type InvoiceSettingsRow = {
  prefix: string;
  start_number: number;
  current_number: number;
  updated_at: string;
  updated_by: string | null;
};
