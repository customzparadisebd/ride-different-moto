import { createFileRoute } from "@tanstack/react-router";

import { ProductGrid } from "@/components/ProductCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { getProducts } from "@/data/catalog";

const title = "Shop Modification Parts — Customz Paradise BD";
const description =
  "Browse premium motorcycle modification parts and accessories with BDT pricing and nationwide delivery in Bangladesh.";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const products = getProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Shop</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        All available modification parts and accessories.
      </p>
      <div className="mt-8">
        <SectionHeading eyebrow={`${products.length} products`} title="All Products" />
        <ProductGrid products={products} />
      </div>
    </div>
  );
}