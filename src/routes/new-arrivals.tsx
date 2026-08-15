import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProductGrid } from "@/components/ProductCard";
import { storefrontProductsQuery } from "@/lib/storefront.queries";
import { site } from "@/data/site";

const title = "New Motorcycle Modification Parts & Accessories BD — Customz Paradise BD";
const description =
  "Discover the latest premium motorcycle modification parts and accessories in Bangladesh. Stay ahead with new visual upgrades and custom kits.";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/new-arrivals` },
    ],
    links: [{ rel: "canonical", href: `${site.url}/new-arrivals` }],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(storefrontProductsQuery());
  },
  component: NewArrivalsPage,
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
      No new arrivals yet.
    </p>
  ),
});

function NewArrivalsPage() {
  const { data: products } = useSuspenseQuery(storefrontProductsQuery());
  const newArrivals = products.filter((product) => product.newArrival);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-primary">Just landed</p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        New Arrivals
      </h1>
      <div className="mt-8">
        <ProductGrid products={newArrivals} />
      </div>
    </div>
  );
}
