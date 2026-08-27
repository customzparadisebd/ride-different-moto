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
  currentNumber: z.number().int().min(0).max(999999), // This represents the LAST used number
  nextNumber: z.number().int().min(1).max(999999).optional(), // Used for setting the NEXT serial
});

export type InvoiceSettings = z.infer<typeof invoiceSettingsInput>;

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: "CZP",
  startNumber: 1,
  currentNumber: 0,
};

/** Mirrors the database formatting rules: 01..09 padded, 10+ plain. */
export function formatInvoiceNo(prefix: string, num: number): string {
  return `${prefix}-${num < 10 ? num.toString().padStart(2, "0") : num}`;
}

/** Full server payload for the admin invoice panel. */
export type InvoiceSettingsState = InvoiceSettings & {
  currentNumber: number;
  nextNumber: number;
  /** The invoice number the next created order will receive. */
  nextInvoiceNo: string;
  /** The invoice number of the most recently created order (history, unchanged). */
  lastInvoiceNo: string | null;
};

export type InvoiceSettingsRow = {
  prefix: string;
  start_number: number;
  current_number: number;
  updated_at: string;
  updated_by: string | null;
};
