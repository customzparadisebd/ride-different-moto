import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";
import {
  parseSectionSettingRow,
  sectionSettingInput,
  type SectionSetting,
} from "./sections.shared";

async function getEffectiveClient() {
  if (typeof window !== "undefined") return supabase;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getSectionSettings = createServerFn({ method: "POST" }).handler(
  async (): Promise<SectionSetting[]> => {
    const client = await getEffectiveClient();
    const { data, error } = await client
      .from("section_settings")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (error || !data) return [];
    return data.map(parseSectionSettingRow);
  },
);

export const saveSectionSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => sectionSettingInput.parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.productsManage);

    const before = await context.supabase
      .from("section_settings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await context.supabase
      .from("section_settings")
      .upsert({
        id: data.id,
        name: data.name,
        enabled: data.enabled,
        display_limit: data.displayLimit,
        show_see_all: data.showSeeAll,
        button_text: data.buttonText,
        button_link: data.buttonLink,
        sort_order: data.sortOrder,
        is_slider: data.isSlider,
        slider_items: data.sliderItems ?? null,
        product_category: data.productCategory ?? null,
        updated_at: new Date().toISOString(),
      } as any);

    if (error) throw new Error(`Could not save section setting for ${data.id}`);

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "section_settings",
      targetId: data.id,
      targetLabel: `Section: ${data.name}`,
      oldValue: before.data as any,
      newValue: data as any,
    });

    return { ok: true };
  });
