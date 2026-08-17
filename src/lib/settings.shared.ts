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
  // WHATSAPP SUPPORT — COMPLETED
  whatsappPhone: z.string().trim().min(6).max(40),
  whatsappMessage: z.string().trim().min(4).max(200),
  whatsappFloatingEnabled: z.boolean().default(true),
  whatsappFloatingPosition: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
    .default("bottom-right"),
});

export type StoreSettings = z.infer<typeof storeSettingsInput>;

export const siteSettingsInput = z.object({
  productionDomain: z.string().trim().min(3).max(100),
  businessName: z.string().trim().min(2).max(100),
  businessDescription: z.string().trim().min(10).max(1000).optional().or(z.literal("")),
  tagline: z.string().trim().min(2).max(200).optional().or(z.literal("")),
  address: z.string().trim().min(5).max(300).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(40).optional().or(z.literal("")),
  whatsapp: z.string().trim().min(6).max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  socialLinks: z.array(z.object({ name: z.string(), href: z.string() })).default([]),
  businessHours: z.record(z.string()).default({}),
  mainBranchInfo: z.string().trim().max(1000).optional().or(z.literal("")),
  branchRelationship: z.string().trim().max(1000).optional().or(z.literal("")),
  defaultMetaTitle: z.string().trim().max(200).optional().or(z.literal("")),
  defaultMetaDescription: z.string().trim().max(400).optional().or(z.literal("")),
  organizationSchema: z.record(z.any()).default({}),
  localBusinessSchema: z.record(z.any()).default({}),
});

export type SiteSettings = z.infer<typeof siteSettingsInput>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  productionDomain: "customzparadisebd.com",
  businessName: "Customz Paradise BD",
  businessDescription: "Premium motorcycle modification parts and accessories in Bangladesh. Unique designs, quality-focused products and nationwide delivery.",
  tagline: "Ride Different. Be Different.",
  address: "Uttara-1230, Dhaka, Bangladesh",
  city: "Dhaka",
  country: "Bangladesh",
  phone: "+880 1890-722202",
  whatsapp: "8801890722202",
  email: "customzparadisebd@gmail.com",
  socialLinks: [
    { name: "Facebook", href: "https://www.facebook.com/customzparadisebd" },
    { name: "Instagram", href: "https://www.instagram.com/customz_paradise_bd" },
    { name: "YouTube", href: "https://www.youtube.com/@CustomzParadiseBD" },
  ],
  businessHours: {
    Monday: "09:00 - 21:00",
    Tuesday: "09:00 - 21:00",
    Wednesday: "09:00 - 21:00",
    Thursday: "09:00 - 21:00",
    Friday: "09:00 - 21:00",
    Saturday: "09:00 - 21:00",
    Sunday: "09:00 - 21:00",
  },
  mainBranchInfo: "Custom Paradise India",
  branchRelationship: "Customz Paradise BD is the Bangladesh branch of Custom Paradise India.",
  defaultMetaTitle: "Customz Paradise BD — Premium Motorcycle Modification Parts in Bangladesh",
  defaultMetaDescription: "Shop high-quality motorcycle modification parts, stickers, and accessories at Customz Paradise BD. Nationwide delivery across Bangladesh. Ride Different. Be Different.",
  organizationSchema: {},
  localBusinessSchema: {},
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shippingFlat: 120,
  zoneCharges: { inside_dhaka: 120, dhaka_suburb: 150, outside_dhaka: 180 },
  paymentMethods: ["cash_on_delivery", "bkash", "nagad", "bank_transfer"],
  supportPhone: "+8801890722202",
  supportEmail: "",
  lowStockThreshold: 3,
  whatsappPhone: "+8801890722202",
  whatsappMessage: "Having any problem with your order? Contact us on WhatsApp.",
  whatsappFloatingEnabled: true,
  whatsappFloatingPosition: "bottom-right",
};

/** Normalises a database row (jsonb columns are `unknown`) into StoreSettings. */
export function parseStoreSettingsRow(row: {
  shipping_flat: number | string;
  zone_charges: unknown;
  payment_methods: unknown;
  support_phone: string;
  support_email: string | null;
  low_stock_threshold: number;
  whatsapp_phone?: string | null;
  whatsapp_message?: string | null;
  whatsapp_floating_enabled?: boolean | null;
  whatsapp_floating_position?: string | null;
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
    whatsappPhone: row.whatsapp_phone || DEFAULT_STORE_SETTINGS.whatsappPhone,
    whatsappMessage: row.whatsapp_message || DEFAULT_STORE_SETTINGS.whatsappMessage,
    whatsappFloatingEnabled:
      row.whatsapp_floating_enabled ?? DEFAULT_STORE_SETTINGS.whatsappFloatingEnabled,
    whatsappFloatingPosition:
      (row.whatsapp_floating_position as any) || DEFAULT_STORE_SETTINGS.whatsappFloatingPosition,
  });
  return parsed.success ? parsed.data : DEFAULT_STORE_SETTINGS;
}

export function parseSiteSettingsRow(row: any): SiteSettings {
  const parsed = siteSettingsInput.safeParse({
    productionDomain: row.production_domain || DEFAULT_SITE_SETTINGS.productionDomain,
    businessName: row.business_name || DEFAULT_SITE_SETTINGS.businessName,
    businessDescription: row.business_description || DEFAULT_SITE_SETTINGS.businessDescription,
    tagline: row.tagline || DEFAULT_SITE_SETTINGS.tagline,
    address: row.address || DEFAULT_SITE_SETTINGS.address,
    city: row.city || DEFAULT_SITE_SETTINGS.city,
    country: row.country || DEFAULT_SITE_SETTINGS.country,
    phone: row.phone || DEFAULT_SITE_SETTINGS.phone,
    whatsapp: row.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp,
    email: row.email || DEFAULT_SITE_SETTINGS.email,
    socialLinks: Array.isArray(row.social_links) ? row.social_links : DEFAULT_SITE_SETTINGS.socialLinks,
    businessHours: row.business_hours || DEFAULT_SITE_SETTINGS.businessHours,
    mainBranchInfo: row.main_branch_info || DEFAULT_SITE_SETTINGS.mainBranchInfo,
    branchRelationship: row.branch_relationship || DEFAULT_SITE_SETTINGS.branchRelationship,
    defaultMetaTitle: row.default_meta_title || DEFAULT_SITE_SETTINGS.defaultMetaTitle,
    defaultMetaDescription: row.default_meta_description || DEFAULT_SITE_SETTINGS.defaultMetaDescription,
    organizationSchema: row.organization_schema || DEFAULT_SITE_SETTINGS.organizationSchema,
    localBusinessSchema: row.local_business_schema || DEFAULT_SITE_SETTINGS.localBusinessSchema,
  });
  return parsed.success ? parsed.data : DEFAULT_SITE_SETTINGS;
}

export const SETTINGS_COLUMNS =
  "shipping_flat, zone_charges, payment_methods, support_phone, support_email, low_stock_threshold, whatsapp_phone, whatsapp_message, whatsapp_floating_enabled, whatsapp_floating_position";

export const SITE_SETTINGS_COLUMNS =
  "production_domain, business_name, business_description, tagline, address, city, country, phone, whatsapp, email, social_links, business_hours, main_branch_info, branch_relationship, default_meta_title, default_meta_description, organization_schema, local_business_schema";