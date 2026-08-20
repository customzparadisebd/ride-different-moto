// ============================================================
// SITE SETTINGS ENDPOINTS
// Purpose: Manage business identity and SEO settings.
// Security: Reads are public (anon); updates require super_admin
//          or admin role, enforced by RLS and server code.
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  DEFAULT_SITE_SETTINGS,
  parseSiteSettingsRow,
  SITE_SETTINGS_COLUMNS,
  siteSettingsInput,
  type SiteSettings,
} from "./settings.shared";

/** Publishable-key client for public reads (no session, RLS as anon). */
function getEffectiveClient() {
  if (typeof window !== "undefined") return supabase;
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

export const getSiteSettings = createServerFn({ method: "POST" })
  .handler(async () => {
    const { data, error } = await getEffectiveClient()
      .from("site_settings")
      .select(SITE_SETTINGS_COLUMNS)
      .eq("id", "default")
      .maybeSingle();
    if (error || !data) return DEFAULT_SITE_SETTINGS;
    return parseSiteSettingsRow(data);
  },
);

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => siteSettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("site_settings")
      .select(SITE_SETTINGS_COLUMNS)
      .eq("id", "default")
      .maybeSingle();

    const { error } = await context.supabase
      .from("site_settings")
      .update({
        production_domain: data.productionDomain,
        business_name: data.businessName,
        business_description: data.businessDescription || null,
        tagline: data.tagline || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        social_links: data.socialLinks as any,
        business_hours: data.businessHours as any,
        main_branch_info: data.mainBranchInfo || null,
        branch_relationship: data.branchRelationship || null,
        default_meta_title: data.defaultMetaTitle || null,
        default_meta_description: data.defaultMetaDescription || null,
        organization_schema: data.organizationSchema as any,
        local_business_schema: data.localBusinessSchema as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default");

    if (error) throw new Error("Could not save the site settings.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "site_settings",
      targetId: "default",
      targetLabel: "Site identity & SEO",
      oldValue: (before.data ?? null) as any,
      newValue: data as any,
    });
    return { ok: true };
  });