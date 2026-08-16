import { z } from "zod";

export const AI_PROVIDERS = ["gemini", "openai", "custom"] as const;
export type AIProviderType = (typeof AI_PROVIDERS)[number];

export const aiSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(AI_PROVIDERS).default("gemini"),
  modelName: z.string().trim().max(100).optional().or(z.literal("")),
  apiKey: z.string().trim().max(500).optional().or(z.literal("")),
  credentials: z.record(z.any()).default({}),
});

export type AISettings = z.infer<typeof aiSettingsSchema>;

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  provider: "gemini",
  modelName: "",
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
