// ============================================================
// STOREFRONT CATALOGUE ENDPOINTS (public)
// Purpose: Feeds the landing page "All Products" section and the
//          product detail page from the database.
// Status: COMPLETED
// Security: Read-only and anonymous by design; only active,
//          non-deleted products and active colours are returned.
// ============================================================
import { createServerFn } from "@tanstack/react-start";

import { productSlugInput } from "./storefront.shared";

export const listStorefrontProducts = createServerFn({ method: "POST" }).handler(async () => {
  const { fetchActiveProducts } = await import("./storefront.server");
  return fetchActiveProducts();
});

export const getStorefrontProduct = createServerFn({ method: "POST" })
  .validator((input: unknown) => productSlugInput.parse(input))
  .handler(async ({ data }) => {
    const { fetchProductBySlug } = await import("./storefront.server");
    return fetchProductBySlug(data.slug);
  });
