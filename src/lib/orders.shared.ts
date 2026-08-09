import { z } from "zod";

/** Shapes shared by the storefront checkout and the admin panel. Client-safe. */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded"] as const;

export const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

/**
 * Courier / delivery pipeline. Kept as a small closed list so the admin panel
 * and any future courier API integration agree on the same vocabulary.
 */
export const COURIER_STATUSES = [
  "not_booked",
  "booked",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
] as const;

/** Delivery zones used for pricing/filtering inside Bangladesh. */
export const DELIVERY_ZONES = [
  { value: "inside_dhaka", label: "Inside Dhaka" },
  { value: "dhaka_suburb", label: "Dhaka Suburb" },
  { value: "outside_dhaka", label: "Outside Dhaka" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type CourierStatus = (typeof COURIER_STATUSES)[number];

const money = z.number().finite().min(0).max(10_000_000);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const orderItemInput = z.object({
  productId: z.string().trim().max(120).optional(),
  productSlug: z.string().trim().max(160).optional(),
  productName: z.string().trim().min(1).max(200),
  variant: optionalText(200),
  imageUrl: z.string().trim().max(600).optional().or(z.literal("")),
  unitPrice: money,
  quantity: z.number().int().min(1).max(999),
});

export const checkoutInput = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name").max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(?:\+?880|0)1[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
  customerEmail: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  addressLine: z.string().trim().min(6, "Please enter your full address").max(400),
  city: z.string().trim().min(2, "Please enter your city").max(120),
  deliveryZone: z.enum(["inside_dhaka", "dhaka_suburb", "outside_dhaka"]).default("inside_dhaka"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  paymentMethod: z.enum(["cash_on_delivery", "bkash", "nagad", "bank_transfer"]),
  items: z.array(orderItemInput).min(1, "Your cart is empty").max(50),
  idempotencyKey: z.string().trim().min(8).max(80),
});

/**
 * What the storefront actually submits: product ids + quantity only.
 * Prices are resolved server-side from the catalog so they can't be tampered with.
 */
export const checkoutSubmitInput = checkoutInput.omit({ items: true }).extend({
  items: z
    .array(z.object({ productId: z.string().trim().min(1).max(120), quantity: z.number().int().min(1).max(999) }))
    .min(1, "Your cart is empty")
    .max(50),
});

export type CheckoutSubmitInput = z.infer<typeof checkoutSubmitInput>;

export const adminOrderInput = checkoutInput.extend({
  discount: money.default(0),
  shipping: money.default(0),
  advancePaid: money.default(0),
  transactionId: optionalText(120),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("unpaid"),
  status: z.enum(ORDER_STATUSES).default("pending"),
});

/**
 * Everything an admin may change on an existing order. Each field is optional
 * so the UI can patch one control at a time; the server validates and audits
 * whichever fields arrive.
 */
export const orderStatusUpdateInput = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(["cash_on_delivery", "bkash", "nagad", "bank_transfer"]).optional(),
  transactionId: optionalText(120),
  advancePaid: money.optional(),
  discount: money.optional(),
  shipping: money.optional(),
  deliveryZone: z.enum(["inside_dhaka", "dhaka_suburb", "outside_dhaka"]).optional(),
  courierName: optionalText(120),
  courierTrackingId: optionalText(160),
  courierStatus: z.enum(COURIER_STATUSES).optional(),
  internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional(),
});

/** Server-side filters for the admin order list. All optional. */
export const orderFilterInput = z.object({
  invoiceNo: optionalText(60),
  customerName: optionalText(120),
  customerPhone: optionalText(40),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  deliveryZone: z.enum(["inside_dhaka", "dhaka_suburb", "outside_dhaka"]).optional(),
  dateFrom: optionalText(30),
  dateTo: optionalText(30),
  limit: z.number().int().min(1).max(500).default(200),
});

export type OrderFilterInput = z.input<typeof orderFilterInput>;

export type CheckoutInput = z.infer<typeof checkoutInput>;
export type AdminOrderInput = z.input<typeof adminOrderInput>;

export const statusLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const paymentMethodLabel = (value: string) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label ?? statusLabel(value);

export const deliveryZoneLabel = (value: string | null | undefined) =>
  !value ? "—" : (DELIVERY_ZONES.find((z) => z.value === value)?.label ?? statusLabel(value));

/** Flat shipping fee applied to every website order (BDT). */
export const SHIPPING_FLAT_BDT = 120;

export const newIdempotencyKey = () =>
  `czp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;