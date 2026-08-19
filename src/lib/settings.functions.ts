// src/lib/settings.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { PERMISSIONS } from "./admin.shared";

export const getSectionSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("section_settings").select("*");
  if (error) throw new Error(error.message);
  return data.map((s: any) => ({
    sectionKey: s.section_key,
    data: s.data
  }));
});

export const updateSectionSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({
    sectionKey: z.string(),
    data: z.any()
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(await resolveActor(context.userId, context.claims as never), PERMISSIONS.productsManage);
    
    const { error } = await context.supabase
      .from("section_settings")
      .upsert({ section_key: data.sectionKey, data: data.data }, { onConflict: "section_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
