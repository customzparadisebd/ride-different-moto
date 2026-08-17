import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProductBrowser } from "@/components/ProductBrowser";
import { SectionHeading } from "@/components/home/SectionHeading";
import { storefrontProductsQuery } from "@/lib/storefront.queries";
import { site } from "@/data/site";

const title = "Shop Motorcycle Parts & Accessories — Customz Paradise BD";
const description = "Browse our full collection of premium motorcycle modification parts, stickers, and accessories. Nationwide delivery in Bangladesh. Ride Different. Be Different.";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/shop` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${site.url}/shop` }],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(storefrontProductsQuery());
  },
  component: ShopPage,
  errorComponent: ({ error }) => (
    <p
      role="alert"
      className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground"
    >
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <p className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
      No products found.
    </p>
  ),
});

function ShopPage() {
  const { data: products } = useSuspenseQuery(storefrontProductsQuery());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Shop</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        All available modification parts and accessories.
      </p>
      <div className="mt-8">
        <SectionHeading eyebrow={`${products.length} products`} title="All Products" />
        {/* PRODUCT SEARCH & FILTERS — COMPLETED */}
        <ProductBrowser products={products} />
      </div>
    </div>
  );
}
