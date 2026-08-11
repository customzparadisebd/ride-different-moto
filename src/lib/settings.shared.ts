// ============================================================
// STORE SETTINGS CONTRACT
// Purpose: Client-safe shapes for the operations settings that used
//          to be hard-coded (delivery charges, payment methods,
//          support contact, low-stock threshold).
// Status: COMPLETED
// Security: Reads are public (these values are shown at checkout);
//          writes require the products.manage permission, enforced
//          both by RLS and by the server function.
// ============================================================
import { z } from "zod";

import { DELIVERY_ZONES, PAYMENT_METHODS } from "./orders.shared";

export const ZONE_KEYS = DELIVERY_ZONES.map((z) => z.value);
export type ZoneKey = (typeof DELIVERY_ZONES)[number]["value"];
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

const money = z.number().finite().min(0).max(100000);

export const storeSettingsInput = z.object({
  shippingFlat: money,
  zoneCharges: z.object({
    inside_dhaka: money,
    dhaka_suburb: money,
    outside_dhaka: money,
  }),
  paymentMethods: z
    .array(z.enum(["cash_on_delivery", "bkash", "nagad", "bank_transfer"]))
    .min(1, "Keep at least one payment method enabled"),
  supportPhone: z.string().trim().min(6).max(40),
  supportEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  lowStockThreshold: z.number().int().min(0).max(999),
});

export type StoreSettings = z.infer<typeof storeSettingsInput>;

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shippingFlat: 120,
  zoneCharges: { inside_dhaka: 120, dhaka_suburb: 150, outside_dhaka: 180 },
  paymentMethods: ["cash_on_delivery", "bkash", "nagad", "bank_transfer"],
  supportPhone: "+8801890722202",
  supportEmail: "",
  lowStockThreshold: 3,
};

/** Normalises a database row (jsonb columns are `unknown`) into StoreSettings. */
export function parseStoreSettingsRow(row: {
  shipping_flat: number | string;
  zone_charges: unknown;
  payment_methods: unknown;
  support_phone: string;
  support_email: string | null;
  low_stock_threshold: number;
}): StoreSettings {
  const zones = (row.zone_charges ?? {}) as Partial<Record<ZoneKey, number>>;
  const methods = Array.isArray(row.payment_methods)
    ? (row.payment_methods as string[]).filter((m) => PAYMENT_METHODS.some((p) => p.value === m))
    : [];
  const parsed = storeSettingsInput.safeParse({
    shippingFlat: Number(row.shipping_flat),
    zoneCharges: {
      inside_dhaka: Number(zones.inside_dhaka ?? DEFAULT_STORE_SETTINGS.zoneCharges.inside_dhaka),
      dhaka_suburb: Number(zones.dhaka_suburb ?? DEFAULT_STORE_SETTINGS.zoneCharges.dhaka_suburb),
      outside_dhaka: Number(
        zones.outside_dhaka ?? DEFAULT_STORE_SETTINGS.zoneCharges.outside_dhaka,
      ),
    },
    paymentMethods: methods.length ? methods : DEFAULT_STORE_SETTINGS.paymentMethods,
    supportPhone: row.support_phone,
    supportEmail: row.support_email ?? "",
    lowStockThreshold: row.low_stock_threshold,
  });
  return parsed.success ? parsed.data : DEFAULT_STORE_SETTINGS;
}

export const SETTINGS_COLUMNS =
  "shipping_flat, zone_charges, payment_methods, support_phone, support_email, low_stock_threshold";
