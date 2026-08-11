// ============================================================
// CITY & DELIVERY ZONES — COMPLETED (server-only reads)
// Purpose: Public reads for the checkout configuration and the
//          trusted delivery-charge lookup used when pricing orders.
// Security: Uses the publishable key, so the public "active only"
//          RLS policies apply. The browser never supplies a
//          delivery charge — it is resolved here from the database.
// ============================================================
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type { CheckoutConfig, City, DeliveryZoneOption } from "./checkout-config.shared";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const FALLBACK_ZONES: DeliveryZoneOption[] = [
  { id: "inside_dhaka", slug: "inside_dhaka", name: "Inside Dhaka", charge: 200, isActive: true, sortOrder: 1 },
  { id: "dhaka_suburb", slug: "dhaka_suburb", name: "Suburban Dhaka", charge: 200, isActive: true, sortOrder: 2 },
  { id: "outside_dhaka", slug: "outside_dhaka", name: "Outside Dhaka", charge: 200, isActive: true, sortOrder: 3 },
];

/** Active cities + active zones + WhatsApp support details for the checkout page. */
export async function fetchCheckoutConfig(): Promise<CheckoutConfig> {
  const supabase = publicClient();
  const [cities, zones, settings] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("delivery_zones")
      .select("id, slug, name, charge, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("store_settings")
      .select("whatsapp_phone, whatsapp_message")
      .eq("id", "default")
      .maybeSingle(),
  ]);

  const cityList: City[] = (cities.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));

  const zoneList: DeliveryZoneOption[] = (zones.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    charge: Number(row.charge),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));

  return {
    cities: cityList,
    zones: zoneList.length ? zoneList : FALLBACK_ZONES,
    whatsappPhone: settings.data?.whatsapp_phone ?? "+8801890722202",
    whatsappMessage:
      settings.data?.whatsapp_message ?? "Having any problem with your order? Contact us on WhatsApp.",
  };
}

/** Trusted delivery charge for a zone slug. Inactive/unknown zones are rejected. */
export async function resolveZoneCharge(slug: string): Promise<number> {
  const { data } = await publicClient()
    .from("delivery_zones")
    .select("charge, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (data?.is_active) return Number(data.charge);
  const fallback = FALLBACK_ZONES.find((zone) => zone.slug === slug);
  if (!fallback) throw new Error("Please choose an available delivery zone.");
  return fallback.charge;
}

/** Confirms the submitted city is one of the active cities. */
export async function assertCityAllowed(city: string): Promise<void> {
  const { data } = await publicClient().from("cities").select("id").eq("is_active", true).limit(1000);
  if (!data || data.length === 0) return; // no list configured yet — accept free text
  const { data: match } = await publicClient()
    .from("cities")
    .select("id")
    .eq("is_active", true)
    .ilike("name", city)
    .maybeSingle();
  if (!match) throw new Error("Please select your city from the list.");
}
