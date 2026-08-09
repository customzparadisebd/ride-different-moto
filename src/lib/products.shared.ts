// ============================================================
// PRODUCT CONTRACTS (client-safe)
// Purpose: Shapes for the database-backed product catalog:
//          create/edit, stock, flags and Recycle Bin actions.
// Status: COMPLETED
// Security: Labels and validation only. Every write is
//          re-validated and permission-checked server-side.
// ============================================================
import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "graphics",
  "lighting",
  "seat",
  "exhaust",
  "handlebar",
  "body-kit",
  "accessories",
  "other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const STOCK_FILTERS = ["all", "in_stock", "low_stock", "out_of_stock"] as const;

const money = z.number().finite().min(0).max(10_000_000);
const blankable = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const productInput = z.object({
  name: z.string().trim().min(2).max(200),
  sku: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  imageUrl: blankable(600),
  category: z.enum(PRODUCT_CATEGORIES),
  bikeCompatibility: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  isUniversal: z.boolean().default(false),
  description: blankable(2000),
  price: money,
  offerPrice: money.optional().nullable(),
  stockQty: z.number().int().min(0).max(999999),
  isBestDeal: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type ProductInput = z.input<typeof productInput>;

export const productUpdateInput = productInput.extend({ id: z.string().uuid() });

export const productListInput = z.object({
  search: blankable(120),
  category: z.string().trim().max(40).optional(),
  stock: z.enum(STOCK_FILTERS).default("all"),
  activeOnly: z.boolean().default(false),
  deleted: z.boolean().default(false),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
});

export const productDeleteInput = z.object({
  id: z.string().uuid(),
  reason: blankable(300),
});

export const productRestoreInput = z.object({ id: z.string().uuid() });

export const productPurgeInput = z.object({
  id: z.string().uuid(),
  confirmName: z.string().trim().min(1).max(200),
});

export const productStockInput = z.object({
  id: z.string().uuid(),
  stockQty: z.number().int().min(0).max(999999),
});

export const productToggleInput = z.object({
  id: z.string().uuid(),
  field: z.enum(["isActive", "isBestDeal", "isFeatured", "isNewArrival"]),
  value: z.boolean(),
});

export function stockStatus(qty: number, lowThreshold: number) {
  if (qty <= 0) return { key: "out_of_stock", label: "Out of stock" } as const;
  if (qty <= lowThreshold) return { key: "low_stock", label: "Low stock" } as const;
  return { key: "in_stock", label: "In stock" } as const;
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);

export const categoryLabel = (value: string) =>
  value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Column list + row mappers live here so the server-function module stays a thin wrapper. */
export const PRODUCT_COLUMNS =
  "id, name, sku, slug, image_url, category, bike_compatibility, is_universal, description, price, offer_price, stock_qty, is_best_deal, is_featured, is_new_arrival, is_active, deleted_at, deleted_by, delete_reason, created_at, updated_at";

export const PRODUCT_TOGGLE_COLUMNS = {
  isActive: "is_active",
  isBestDeal: "is_best_deal",
  isFeatured: "is_featured",
  isNewArrival: "is_new_arrival",
} as const;

export function productToRow(data: ReturnType<typeof productInput.parse>) {
  return {
    name: data.name,
    sku: data.sku,
    slug: data.slug,
    image_url: data.imageUrl || null,
    category: data.category,
    bike_compatibility: data.bikeCompatibility,
    is_universal: data.isUniversal,
    description: data.description || null,
    price: data.price,
    offer_price: data.offerPrice ?? null,
    stock_qty: data.stockQty,
    is_best_deal: data.isBestDeal,
    is_featured: data.isFeatured,
    is_new_arrival: data.isNewArrival,
    is_active: data.isActive,
  };
}
