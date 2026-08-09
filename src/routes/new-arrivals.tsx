import { createFileRoute } from "@tanstack/react-router";

import { ProductGrid } from "@/components/ProductCard";
import { getNewArrivals } from "@/data/catalog";

const title = "New Arrivals — Customz Paradise BD";
const description =
  "The latest motorcycle modification parts and accessories added at Customz Paradise BD.";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/new-arrivals" },
    ],
    links: [{ rel: "canonical", href: "/new-arrivals" }],
  }),
  component: NewArrivalsPage,
});

function NewArrivalsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-primary">Just landed</p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        New Arrivals
      </h1>
      <div className="mt-8">
        <ProductGrid products={getNewArrivals()} />
      </div>
    </div>
  );
}