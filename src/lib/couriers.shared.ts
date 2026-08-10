// ============================================================
// COURIER MANAGEMENT — SHARED CONTRACTS (client-safe)
// Purpose: Types, Zod schemas and helpers for the multi-courier
//          system (providers, charges, COD %, extra config fields,
//          shipments and tracking).
// Status: COMPLETED
// Security: Contains NO credentials. API key/secret/username/
//          password/token are write-only: the panel may send them,
//          but no server function ever returns them — only a
//          boolean saying whether a value is stored.
// ============================================================
import { z } from "zod";

/** Providers we ship an adapter for. The registry is open — see couriers.server.ts. */
export const COURIER_PROVIDERS = [
  { slug: "steadfast", label: "SteadFast" },
  { slug: "pathao", label: "Pathao" },
  { slug: "redx", label: "RedX" },
  { slug: "custom", label: "Other / custom API" },
] as const;

const money = z.number().finite().min(0).max(100000);

export const extraFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(60)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, dot, dash or underscore"),
  value: z.string().trim().max(400),
});
export type ExtraField = z.infer<typeof extraFieldSchema>;

export const courierInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, dash or underscore only"),
  name: z.string().trim().min(2, "Courier name is required").max(80),
  logoUrl: z.string().trim().max(600).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  baseUrl: z.string().trim().max(300).optional().or(z.literal("")),
  insideCharge: money,
  outsideCharge: money,
  codPercent: z.number().finite().min(0).max(100),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  extraFields: z.array(extraFieldSchema).max(20),
  /** Write-only. Blank string = keep the stored value, "__clear__" = wipe it. */
  credentials: z.object({
    apiKey: z.string().trim().max(400).optional(),
    apiSecret: z.string().trim().max(400).optional(),
    username: z.string().trim().max(200).optional(),
    password: z.string().trim().max(400).optional(),
    token: z.string().trim().max(1000).optional(),
  }),
});
export type CourierInput = z.infer<typeof courierInput>;

export const CLEAR_SECRET = "__clear__";

export const courierIdInput = z.object({ courierId: z.string().uuid() });
export const courierActiveInput = z.object({
  courierId: z.string().uuid(),
  isActive: z.boolean(),
});

export const bookShipmentInput = z.object({
  orderId: z.string().uuid(),
  courierId: z.string().uuid(),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  /** Explicit retry of a previously failed booking. */
  retry: z.boolean().optional(),
});

export const trackShipmentInput = z.object({ orderId: z.string().uuid() });

/** A courier as the panel sees it — never includes secret values. */
export type CourierSummary = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  baseUrl: string;
  insideCharge: number;
  outsideCharge: number;
  codPercent: number;
  isActive: boolean;
  sortOrder: number;
  extraFields: ExtraField[];
  /** Which credential slots hold a stored value. Values themselves stay server-side. */
  credentialsSet: {
    apiKey: boolean;
    apiSecret: boolean;
    username: boolean;
    password: boolean;
    token: boolean;
  };
};

export type ShipmentResult = {
  orderId: string;
  invoiceNo: string;
  success: boolean;
  message: string;
  consignmentId?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
};

export const emptyCourier = (sortOrder = 0): CourierInput => ({
  slug: "",
  name: "",
  logoUrl: "",
  phone: "",
  baseUrl: "",
  insideCharge: 60,
  outsideCharge: 120,
  codPercent: 1,
  isActive: false,
  sortOrder,
  extraFields: [],
  credentials: {},
});

/** Courier charge for a delivery zone: only "inside_dhaka" counts as inside. */
export function courierChargeForZone(
  courier: Pick<CourierSummary, "insideCharge" | "outsideCharge">,
  zone: string | null | undefined,
) {
  return zone === "inside_dhaka" ? courier.insideCharge : courier.outsideCharge;
}

/** COD fee a courier deducts, rounded to whole taka. */
export function codFee(courier: Pick<CourierSummary, "codPercent">, codAmount: number) {
  return Math.round((codAmount * courier.codPercent) / 100);
}

/** Maps any courier's raw delivery status onto our internal courier vocabulary. */
export function mapCourierStatus(raw: string | null | undefined) {
  const value = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  if (["delivered", "partial_delivered", "delivery_completed"].includes(value)) return "delivered";
  if (value.includes("return")) return "returned";
  if (["cancelled", "canceled", "unknown_approved"].includes(value)) return "cancelled";
  if (["failed", "delivery_failed"].includes(value)) return "failed";
  if (["picked", "picked_up", "pickup_done"].includes(value)) return "picked_up";
  if (["on_the_way", "delivered_approval_pending", "out_for_delivery"].includes(value)) {
    return "out_for_delivery";
  }
  if (["hold", "in_review", "pending", "booked", "pickup_pending"].includes(value)) return "booked";
  if (value) return "in_transit";
  return "booked";
}
