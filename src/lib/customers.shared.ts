import { z } from "zod";

export const customerListInput = z.object({
  search: z.string().trim().max(120).optional(),
  deleted: z.boolean().default(false),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
  status: z.enum(["all", "active", "fraud"]).default("all"),
});

export const customerDeleteInput = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
});

export const customerRestoreInput = z.object({
  id: z.string().uuid(),
});

export const customerPurgeInput = z.object({
  id: z.string().uuid(),
  confirmPhone: z.string().trim().min(1).max(40),
});

export type CustomerListInput = z.infer<typeof customerListInput>;
export type CustomerDeleteInput = z.infer<typeof customerDeleteInput>;
export type CustomerRestoreInput = z.infer<typeof customerRestoreInput>;
export type CustomerPurgeInput = z.infer<typeof customerPurgeInput>;
