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
  details: blankable(4000),
  /** Extra gallery images (main image stays `imageUrl`). */
  images: z.array(z.string().trim().min(1).max(600)).max(12).default([]),
  badgeEnabled: z.boolean().default(false),
  badgeText: blankable(40),
  price: money,
  offerPrice: money.optional().nullable(),
  stockQty: z.number().int().min(0).max(999999),
  isBestDeal: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  has360View: z.boolean().default(false),
  videoEnabled: z.boolean().default(false),
  videoPlatform: z.enum(["youtube", "facebook", "instagram", "tiktok"]).optional().nullable(),
  videoUrl: blankable(600),
  outOfStockToggle: z.boolean().default(false),
});
export type ProductInput = z.input<typeof productInput>;

// PRODUCT COLOR VARIATIONS (admin contracts)
// Purpose: Add/edit/enable/reorder colour options with their own
//          price difference and colour-specific image.
// Status: COMPLETED
export const productColorInput = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  swatch: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex colour like #1D3F8F"),
  priceDelta: z.number().finite().min(-1_000_000).max(1_000_000).default(0),
  imageUrl: blankable(600),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});
export type ProductColorInput = z.input<typeof productColorInput>;

export const productColorListInput = z.object({ productId: z.string().uuid() });
export const productColorDeleteInput = z.object({ id: z.string().uuid() });
export const productColorReorderInput = z.object({
  productId: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1).max(40),
});

export const PRODUCT_COLOR_COLUMNS =
  "id, product_id, name, swatch, price_delta, image_url, is_active, sort_order";

// PRODUCT 360 VIEWER (admin contracts)
// Purpose: Manage 360° image sequences per product.
export const product360ImageInput = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  imageUrl: z.string().trim().min(1).max(600),
  displayOrder: z.number().int().min(0).max(999).default(0),
});
export type Product360ImageInput = z.input<typeof product360ImageInput>;

export const product360ListInput = z.object({ productId: z.string().uuid() });
export const product360DeleteInput = z.object({ id: z.string().uuid() });
export const product360ReorderInput = z.object({
  productId: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const PRODUCT_360_COLUMNS = "id, product_id, image_url, display_order";

export function product360ToRow(data: ReturnType<typeof product360ImageInput.parse>) {
  return {
    product_id: data.productId,
    image_url: data.imageUrl,
    display_order: data.displayOrder,
  };
}

export function productColorToRow(data: ReturnType<typeof productColorInput.parse>) {
  return {
    product_id: data.productId,
    name: data.name,
    swatch: data.swatch,
    price_delta: data.priceDelta,
    image_url: data.imageUrl || null,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  };
}

export const productUpdateInput = productInput.extend({ id: z.string().uuid() });

export const productListInput = z.object({
  search: blankable(120),
  category: z.string().trim().max(40).optional(),
  stock: z.enum(STOCK_FILTERS).default("all"),
  activeOnly: z.boolean().default(false),
  deleted: z.boolean().default(false),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(500).default(25),
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
  field: z.enum([
    "isActive",
    "isBestDeal",
    "isFeatured",
    "isNewArrival",
    "badgeEnabled",
    "has360View",
  ]),
  value: z.boolean(),
});

export const featuredProductsUpdateInput = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int(),
      badgeText: z.string().trim().max(40).optional().nullable(),
      badgeEnabled: z.boolean(),
    }),
  ),
});

export const bulkProductUpdateInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  isActive: z.boolean().optional(),
  isBestDeal: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
});

export const bulkProductRecycleInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  reason: blankable(300),
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
  "id, name, sku, slug, image_url, category, bike_compatibility, is_universal, description, details, images, badge_enabled, badge_text, price, offer_price, stock_qty, is_best_deal, is_featured, is_new_arrival, is_active, has_360_view, video_enabled, video_platform, video_url, out_of_stock_toggle, deleted_at, deleted_by, delete_reason, created_at, updated_at";

export const PRODUCT_TOGGLE_COLUMNS = {
  isActive: "is_active",
  isBestDeal: "is_best_deal",
  isFeatured: "is_featured",
  isNewArrival: "is_new_arrival",
  badgeEnabled: "badge_enabled",
  has360View: "has_360_view",
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
    details: data.details || null,
    images: data.images,
    badge_enabled: data.badgeEnabled,
    badge_text: data.badgeText || null,
    price: data.price,
    offer_price: data.offerPrice ?? null,
    stock_qty: data.stockQty,
    is_best_deal: data.isBestDeal,
    is_featured: data.isFeatured,
    is_new_arrival: data.isNewArrival,
    is_active: data.isActive,
    has_360_view: data.has360View,
    video_enabled: data.videoEnabled,
    video_platform: data.videoPlatform || null,
    video_url: data.videoUrl || null,
    out_of_stock_toggle: data.outOfStockToggle,
  };
}

export const reorderProductsInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export const PRODUCT_ORDER_COLUMNS = "id, name, sku, image_url, category, sort_order, is_active";

export const bulkProductImageInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  imageUrl: z.string().trim().min(1).max(600).optional(),
  appendGallery: z.array(z.string().trim().min(1).max(600)).optional(),
  replaceGallery: z.array(z.string().trim().min(1).max(600)).optional(),
});
