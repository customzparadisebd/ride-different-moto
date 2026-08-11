// ============================================================
// CITY & DELIVERY ZONES — COMPLETED
// Purpose: Client-safe shapes for the admin-managed checkout
//          configuration: city/district list, delivery zones with
//          their charges, and the WhatsApp support details.
// Security: Types and validators only. Delivery charges are always
//          re-resolved server-side when an order is priced.
// ============================================================
import { z } from "zod";

export type City = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type DeliveryZoneOption = {
  id: string;
  slug: string;
  name: string;
  charge: number;
  isActive: boolean;
  sortOrder: number;
};

export type CheckoutConfig = {
  cities: City[];
  zones: DeliveryZoneOption[];
  whatsappPhone: string;
  whatsappMessage: string;
};

const money = z.number().finite().min(0).max(100000);

export const cityInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter a city name").max(80),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export const cityIdInput = z.object({ id: z.string().uuid() });

export const cityReorderInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export const zoneUpdateInput = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Enter a zone name").max(80),
  charge: money,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export type CityInput = z.input<typeof cityInput>;
export type ZoneUpdateInput = z.input<typeof zoneUpdateInput>;

/** Digits-only WhatsApp number for wa.me links. */
export const whatsappDigits = (phone: string) => phone.replace(/\D/g, "");

export const whatsappHref = (phone: string, text?: string) => {
  const base = `https://wa.me/${whatsappDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
