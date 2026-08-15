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

export const customerUpdateInput = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(100).optional().nullable(),
  phone: z.string().trim().min(5).max(20).optional(),
  city: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
  area: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
});

export type CustomerListInput = z.infer<typeof customerListInput>;
export type CustomerDeleteInput = z.infer<typeof customerDeleteInput>;
export type CustomerRestoreInput = z.infer<typeof customerRestoreInput>;
export type CustomerPurgeInput = z.infer<typeof customerPurgeInput>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateInput>;
