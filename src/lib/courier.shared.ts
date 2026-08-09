// ============================================================
// COURIER CONTRACTS (client-safe)
// Purpose: Shapes for the Steadfast courier integration used by the
//          admin panel. Contains no credentials.
// Status: COMPLETED
// Security: API key/secret live only in server-side secrets and are
//          never returned to the browser, not even masked, for Staff.
// ============================================================
import { z } from "zod";

export const sendShipmentsInput = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(50),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const trackShipmentInput = z.object({ orderId: z.string().uuid() });

export type ShipmentResult = {
  orderId: string;
  invoiceNo: string;
  success: boolean;
  message: string;
  consignmentId?: string | null;
  trackingCode?: string | null;
};

/** Public tracking page for a Steadfast tracking code. */
export const steadfastTrackingUrl = (trackingCode: string) =>
  `https://steadfast.com.bd/t/${trackingCode}`;

/** Steadfast delivery statuses mapped onto our courier vocabulary. */
export function mapCourierStatus(raw: string | null | undefined) {
  const value = (raw ?? "").toLowerCase();
  if (["delivered", "partial_delivered"].includes(value)) return "delivered";
  if (["cancelled", "unknown_approved"].includes(value)) return "cancelled";
  if (["hold", "in_review", "pending"].includes(value)) return "booked";
  if (value === "delivered_approval_pending" || value === "on_the_way") return "out_for_delivery";
  if (value.includes("return")) return "returned";
  if (value) return "in_transit";
  return "booked";
}
