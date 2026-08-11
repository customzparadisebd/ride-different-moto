// ============================================================
// STOREFRONT READ LAYER (server-only)
// Purpose: Reads the public product catalogue (active products and
//          active colour variations) with the publishable key, and
//          resolves trusted prices for checkout.
// Status: COMPLETED
// Security: Uses the anon/publishable client, so the public RLS
//          policies ("active products / active colours only") apply.
//          Cart prices from the browser are never trusted — every
//          order line is repriced here from the database.
// ============================================================
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { colorPrice, type StorefrontColor, type StorefrontProduct } from "./storefront.shared";

const PRODUCT_FIELDS =
  "id, name, slug, description, details, category, image_url, images, price, offer_price, stock_qty, is_universal, bike_compatibility, is_best_deal, is_featured, is_new_arrival, badge_enabled, badge_text, is_active, deleted_at";

const COLOR_FIELDS = "id, product_id, name, swatch, price_delta, image_url, is_active, sort_order";

/** Publishable-key client. Opaque `sb_` keys are not JWTs, so only send `apikey`. */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type ProductRow = Record<string, unknown>;

const num = (value: unknown) => (value === null || value === undefined ? 0 : Number(value));

const galleryOf = (images: unknown, main: string | null): string[] => {
  const list = Array.isArray(images)
    ? images.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
  const all = [main, ...list].filter((entry): entry is string => Boolean(entry));
  return Array.from(new Set(all));
};

function toColor(row: ProductRow): StorefrontColor {
  return {
    id: String(row["id"]),
    name: String(row["name"]),
    swatch: String(row["swatch"] ?? "#888888"),
    priceDelta: num(row["price_delta"]),
    image: (row["image_url"] as string | null) ?? null,
  };
}

function toProduct(row: ProductRow, colors: StorefrontColor[]): StorefrontProduct {
  const image = (row["image_url"] as string | null) ?? null;
  const offer = row["offer_price"] === null ? null : num(row["offer_price"]);
  const stockQty = Number(row["stock_qty"] ?? 0);
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    name: String(row["name"]),
    description: (row["description"] as string | null) ?? null,
    details: (row["details"] as string | null) ?? null,
    category: String(row["category"] ?? "other"),
    image,
    gallery: galleryOf(row["images"], image),
    price: num(row["price"]),
    offerPrice: offer,
    stockQty,
    inStock: stockQty > 0,
    universal: Boolean(row["is_universal"]),
    bikeCompatibility: Array.isArray(row["bike_compatibility"])
      ? (row["bike_compatibility"] as string[])
      : [],
    bestDeal: Boolean(row["is_best_deal"]),
    featured: Boolean(row["is_featured"]),
    newArrival: Boolean(row["is_new_arrival"]),
    badgeText: row["badge_enabled"] ? ((row["badge_text"] as string | null) ?? null) : null,
    colors,
  };
}

/** All active, non-deleted products with their active colour options. */
export async function fetchActiveProducts(): Promise<StorefrontProduct[]> {
  const supabase = publicClient();
  const [products, colors] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("product_colors").select(COLOR_FIELDS).eq("is_active", true).order("sort_order"),
  ]);
  if (products.error) throw new Error("Could not load the product catalogue.");

  const byProduct = new Map<string, StorefrontColor[]>();
  for (const row of (colors.data ?? []) as ProductRow[]) {
    const key = String(row["product_id"]);
    const list = byProduct.get(key) ?? [];
    list.push(toColor(row));
    byProduct.set(key, list);
  }

  return ((products.data ?? []) as ProductRow[]).map((row) =>
    toProduct(row, byProduct.get(String(row["id"])) ?? []),
  );
}

export async function fetchProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load this product.");
  if (!data) return null;

  const row = data as ProductRow;
  const { data: colorRows } = await supabase
    .from("product_colors")
    .select(COLOR_FIELDS)
    .eq("product_id", String(row["id"]))
    .eq("is_active", true)
    .order("sort_order");

  return toProduct(row, ((colorRows ?? []) as ProductRow[]).map(toColor));
}

export type PricedLine = {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  variant: string;
  unitPrice: number;
  quantity: number;
};

/**
 * Reprices the submitted cart from the database. The browser only supplies
 * product id, optional colour id and quantity — never money.
 */
export async function priceCartLines(
  items: { productId: string; colorId?: string | undefined; quantity: number }[],
): Promise<PricedLine[]> {
  const catalog = await fetchActiveProducts();
  return items.map((line) => {
    const product = catalog.find((entry) => entry.id === line.productId);
    if (!product || !product.inStock) {
      throw new Error("One of the products in your cart is no longer available.");
    }
    const color = line.colorId ? product.colors.find((c) => c.id === line.colorId) : undefined;
    if (line.colorId && !color) {
      throw new Error(`The selected colour for ${product.name} is no longer available.`);
    }
    return {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      imageUrl: color?.image ?? product.image ?? "",
      // Snapshot of the chosen variation so the admin order view always
      // shows which colour the customer actually ordered.
      variant: color ? `Color: ${color.name}` : "",
      unitPrice: colorPrice(product, color),
      quantity: line.quantity,
    };
  });
}
