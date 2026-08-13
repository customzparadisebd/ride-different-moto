// ============================================================
// STEADFAST BULK SHIPMENT — SHARED CONTRACTS (client-safe)
// Purpose: Types + Zod schemas for the SteadFast settings form and
//          the bulk "Send to SteadFast" action on Admin → Orders.
// Security: NOTHING here holds a credential value. The settings
//          form only ever SENDS secrets; the server returns just
//          "is a value stored" flags.
// ============================================================
import { z } from "zod";

/** Fixed provider slug — the SteadFast courier row is looked up by this. */
export const STEADFAST_SLUG = "steadfast";

/** Blank = keep the stored secret, this marker = wipe it. */
export const CLEAR_SECRET = "__clear__";

/** TODO: confirm with SteadFast if your merchant account uses a different host. */
export const STEADFAST_DEFAULT_BASE_URL = "https://portal.packzy.com/api/v1";

export const steadfastSettingsInput = z.object({
  baseUrl: z.string().trim().min(8, "Base URL is required").max(300),
  isActive: z.boolean(),
  /** Write-only credential slots. */
  apiKey: z.string().trim().max(400).optional(),
  apiSecret: z.string().trim().max(400).optional(),
});
export type SteadfastSettingsInput = z.infer<typeof steadfastSettingsInput>;

export type SteadfastSettings = {
  courierId: string | null;
  baseUrl: string;
  isActive: boolean;
  /** True when a secret is stored — the value itself never leaves the server. */
  hasApiKey: boolean;
  hasApiSecret: boolean;
  /** Ready to book: active + base URL + both credentials present. */
  configured: boolean;
};

export const bulkSteadfastInput = z.object({
  orderIds: z.array(z.string().uuid()).min(1, "Select at least one order").max(50),
  /** Explicit retry of previously failed orders (never re-sends a booked one). */
  retry: z.boolean().optional(),
});

export type SteadfastApiLog = {
  id: string;
  action: string;
  success: boolean;
  status_code: string | null;
  message: string | null;
  created_at: string;
  actor_email: string | null;
};

export type BulkShipmentRow = {

  orderId: string;
  invoiceNo: string;
  success: boolean;
  /** true when the order was skipped because a consignment already exists */
  skipped?: boolean;
  message: string;
  consignmentId?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
};