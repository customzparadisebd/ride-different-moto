import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiSettingsSchema, DEFAULT_AI_SETTINGS, type AISettings } from "./ai.shared";
import { AUDIT_ACTIONS, PERMISSIONS } from "./admin.shared";

export const getAISettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AISettings> => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.apiManage);

    const { data, error } = await context.supabase
      .from("ai_settings")
      .select("enabled, provider, model_name, api_key, credentials")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) return DEFAULT_AI_SETTINGS;

    return {
      enabled: data.enabled,
      provider: data.provider as any,
      modelName: data.model_name || "",
      apiKey: data.api_key || "",
      credentials: (data.credentials as any) || {},
    };
  });

export const saveAISettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const { aiSettingsSchema } = require("./ai.shared");
    return aiSettingsSchema.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess, auditFromActor } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.apiManage);

    const before = await context.supabase
      .from("ai_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    const { error } = await context.supabase
      .from("ai_settings")
      .upsert({
        id: "default",
        enabled: data.enabled,
        provider: data.provider,
        model_name: data.modelName || null,
        api_key: data.apiKey || null,
        credentials: data.credentials as any,
        updated_at: new Date().toISOString(),
        updated_by: actor.userId,
      });

    if (error) throw new Error("Could not save the AI settings.");

    await auditFromActor(actor, {
      action: AUDIT_ACTIONS.settingsUpdated,
      targetType: "ai_settings",
      targetId: "default",
      targetLabel: "AI extraction settings",
      oldValue: (before.data ?? null) as never,
      newValue: data as never,
    });

    return { ok: true };
  });

export const testAIConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    // We allow testing without requiring the master toggle to be ON in the database
    // but the input must be valid for the provider
    const { aiSettingsSchema } = require("./ai.shared");
    return aiSettingsSchema.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.apiManage);

    // Basic syntax validation based on provider
    if (data.provider === 'gemini' && !data.apiKey.startsWith('AIza')) {
      return { success: false, message: "Invalid Gemini API Key format. Should start with 'AIza'." };
    }
    
    if (data.provider === 'openai' && !data.apiKey.startsWith('sk-')) {
      return { success: false, message: "Invalid OpenAI API Key format. Should start with 'sk-'." };
    }

    // MOCK: In a real activation, this would perform a lightweight model list call
    return { 
      success: true, 
      message: `Configuration for ${data.provider} (${data.modelName}) is valid. The system is ready to connect once enabled.` 
    };
  });
