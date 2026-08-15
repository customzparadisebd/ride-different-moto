// ============================================================
// STOREFRONT PRODUCT CONTRACTS (client-safe)
// Purpose: DTO shapes for the customer-facing catalogue plus the
//          colour-variation price helper shared by UI and server.
// Status: COMPLETED
// Security: Types and pure helpers only. Final pricing is always
//          recalculated server-side from the database.
// ============================================================
import { z } from "zod";

export type StorefrontColor = {
  id: string;
  name: string;
  swatch: string;
  priceDelta: number;
  image: string | null;
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  details: string | null;
  category: string;
  image: string | null;
  gallery: string[];
  price: number;
  offerPrice: number | null;
  stockQty: number;
  inStock: boolean;
  universal: boolean;
  bikeCompatibility: string[];
  bestDeal: boolean;
  featured: boolean;
  newArrival: boolean;
  badgeText: string | null;
  colors: StorefrontColor[];
  has360View: boolean;
  product360Images: string[];
  sortOrder: number | null;
};


export const productSlugInput = z.object({ slug: z.string().trim().min(1).max(160) });

/** Base price the customer pays before any colour surcharge. */
export const basePrice = (product: Pick<StorefrontProduct, "price" | "offerPrice">) =>
  product.offerPrice && product.offerPrice > 0 && product.offerPrice < product.price
    ? product.offerPrice
    : product.price;

/**
 * Colour-aware unit price. Same formula runs in the browser (display) and on
 * the server (order pricing), so what the customer sees is what is charged.
 */
export const colorPrice = (
  product: Pick<StorefrontProduct, "price" | "offerPrice">,
  color?: Pick<StorefrontColor, "priceDelta"> | null,
) => Math.max(0, basePrice(product) + (color?.priceDelta ?? 0));

/** Struck-through "was" price for a colour, when an offer is active. */
export const compareAtPrice = (product: StorefrontProduct, color?: StorefrontColor | null) => {
  const offer = basePrice(product);
  if (offer >= product.price) return null;
  return product.price + (color?.priceDelta ?? 0);
};
