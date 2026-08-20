import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "tanstack-zod-adapter";
import { z } from "zod";
import { 
  getSiteLogos, 
  updateSiteLogo, 
  uploadLogo, 
  resetLogoToDefault 
} from "./logos.server";
import { logoUpdateInput, LOGO_CATEGORIES } from "./logos.shared";

export const listLogos = createServerFn({ method: "GET" })
  .handler(async () => {
    return getSiteLogos();
  });

export const updateLogo = createServerFn({ method: "POST" })
  .validator(zodValidator(logoUpdateInput))
  .handler(async ({ data }) => {
    return updateSiteLogo(data);
  });

export const uploadLogoFile = createServerFn({ method: "POST" })
  .validator(zodValidator(z.object({
    category: z.enum(LOGO_CATEGORIES),
    fileData: z.string(), // Base64
    fileName: z.string(),
    contentType: z.string(),
  })))
  .handler(async ({ data }) => {
    return uploadLogo(data.category, data.fileData, data.fileName, data.contentType);
  });

export const resetLogo = createServerFn({ method: "POST" })
  .validator(zodValidator(z.object({
    category: z.enum(LOGO_CATEGORIES),
  })))
  .handler(async ({ data }) => {
    return resetLogoToDefault(data.category);
  });
