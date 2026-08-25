import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getSiteLogos,
  updateSiteLogo,
  uploadLogo,
  resetLogoToDefault,
} from "./logos.server";
import { logoUpdateInput, LOGO_CATEGORIES } from "./logos.shared";
import { PERMISSIONS } from "./admin.shared";

/**
 * Logos are public to read, but every write must be gated: these server
 * functions are public POST endpoints on the deployed site, so the UI's
 * `canManage` flag is not a security boundary on its own.
 */
async function assertCanManageLogos(context: { userId: string; claims: unknown }) {
  const { resolveActor, assertAccess } = await import("./admin.server");
  const actor = await resolveActor(context.userId, context.claims as never);
  assertAccess(actor, PERMISSIONS.contentManage);
}

export const listLogos = createServerFn({ method: "POST" })
  .handler(async () => {
    return getSiteLogos();
  });

export const updateLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => logoUpdateInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertCanManageLogos(context);
    return updateSiteLogo(data);
  });

export const uploadLogoFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    category: z.enum(LOGO_CATEGORIES),
    fileData: z.string(), // Base64
    fileName: z.string(),
    contentType: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertCanManageLogos(context);
    return uploadLogo(data.category, data.fileData, data.fileName, data.contentType);
  });

export const resetLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    category: z.enum(LOGO_CATEGORIES),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertCanManageLogos(context);
    return resetLogoToDefault(data.category);
  });
