import { z } from "zod";

export const AI_PROVIDERS = ["gemini", "openai", "custom"] as const;
export type AIProviderType = (typeof AI_PROVIDERS)[number];

export const aiSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(AI_PROVIDERS).default("gemini"),
  modelName: z.string().trim().max(100).default(""),
  apiKey: z.string().trim().max(500).default(""),
  credentials: z.record(z.string(), z.any()).default({}),
}).superRefine((value, ctx) => {
  // Model + key are only mandatory once AI is switched on, so an
  // "off / not yet configured" state can still be saved.
  if (!value.enabled) return;
  if (!value.modelName) {
    ctx.addIssue({ code: "custom", path: ["modelName"], message: "Model name is required" });
  }
  if (!value.apiKey) {
    ctx.addIssue({ code: "custom", path: ["apiKey"], message: "API Key is required" });
  }
});


export type AISettings = z.infer<typeof aiSettingsSchema>;

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  provider: "gemini",
  modelName: "gemini-1.5-flash",
  apiKey: "",
  credentials: {},
};

export type ExtractedOrderData = {
  customerName?: string;
  customerPhone?: string;
  addressLine?: string;
  city?: string;
  items?: {
    productName: string;
    quantity: number;
    unitPrice?: number;
  }[];
  notes?: string;
};
