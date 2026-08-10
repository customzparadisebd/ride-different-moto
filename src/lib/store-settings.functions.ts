// ============================================================
// STORE SETTINGS ENDPOINTS
// Purpose: Read the operations settings (public, used by checkout)
//          and update them from the admin panel.
// Status: COMPLETED
// Security: The public read uses the publishable key and only ever
//          returns non-sensitive display values. The write requires
//          the products.manage permission and is audited.
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  DEFAULT_STORE_SETTINGS,
  parseStoreSettingsRow,
  SETTINGS_COLUMNS,
  storeSettingsInput,
  type StoreSettings,
} from "./settings.shared";

/** Publishable-key client for public reads (no session, RLS as anon). */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
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

export const getStoreSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => {
    const { data, error } = await publicClient()
      .from("store_settings")
      .select(SETTINGS_COLUMNS)
      .eq("id", "default")
      .maybeSingle();
    if (error || !data) return DEFAULT_STORE_SETTINGS;
    return parseStoreSettingsRow(data as never);
  },
);

export const saveStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => storeSettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("store_settings")
      .select(SETTINGS_COLUMNS)
      .eq("id", "default")
      .maybeSingle();

    const { error } = await context.supabase
      .from("store_settings")
      .update({
        shipping_flat: data.shippingFlat,
        zone_charges: data.zoneCharges as never,
        payment_methods: data.paymentMethods as never,
        support_phone: data.supportPhone,
        support_email: data.supportEmail || null,
        low_stock_threshold: data.lowStockThreshold,
      })
      .eq("id", "default");
    if (error) throw new Error("Could not save the store settings.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "store_settings",
      targetId: "default",
      targetLabel: "Store settings",
      oldValue: (before.data ?? null) as never,
      newValue: data as never,
    });
    return { ok: true };
  });
