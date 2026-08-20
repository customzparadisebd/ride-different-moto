import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { 
  getSiteLogos, 
  updateSiteLogo, 
  uploadLogo, 
  resetLogoToDefault 
} from "./logos.server";
import { logoUpdateInput, LOGO_CATEGORIES } from "./logos.shared";

export const listLogos = createServerFn({ method: "POST" })
  .handler(async () => {
    return getSiteLogos();
  });


export const updateLogo = createServerFn({ method: "POST" })
  .validator((data: unknown) => logoUpdateInput.parse(data))
  .handler(async ({ data }) => {
    return updateSiteLogo(data);
  });

export const uploadLogoFile = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    category: z.enum(LOGO_CATEGORIES),
    fileData: z.string(), // Base64
    fileName: z.string(),
    contentType: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    return uploadLogo(data.category, data.fileData, data.fileName, data.contentType);
  });

export const resetLogo = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    category: z.enum(LOGO_CATEGORIES),
  }).parse(data))
  .handler(async ({ data }) => {
    return resetLogoToDefault(data.category);
  });

