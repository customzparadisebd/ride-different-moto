// ============================================================
// STOREFRONT QUERY OPTIONS
// Purpose: One shared cache entry for the public product catalogue,
//          used by the home page, shop, new arrivals and bike pages.
// Status: COMPLETED
// ============================================================
import { queryOptions } from "@tanstack/react-query";

import { listStorefrontProducts } from "./storefront.functions";

export const storefrontProductsQuery = () =>
  queryOptions({
    queryKey: ["storefront-products"],
    queryFn: () => listStorefrontProducts({ data: undefined }),
    staleTime: 60_000,
  });
