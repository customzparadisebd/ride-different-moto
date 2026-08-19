import { z } from "zod";

export const discountTypeSchema = z.enum(["percentage", "fixed"]);
export type DiscountType = z.infer<typeof discountTypeSchema>;

export const flashSaleInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  discountType: discountTypeSchema,
  discountValue: z.number().min(0),
  isActive: z.boolean().default(false),
  priority: z.number().int().default(0),
  productIds: z.array(z.string().uuid()).default([]),
});

export type FlashSaleInput = z.infer<typeof flashSaleInput>;

export interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  priority: number;
  productIds: string[];
}
