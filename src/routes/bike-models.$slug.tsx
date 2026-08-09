import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { ProductGrid } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { getBikeModel, getProductsForBike } from "@/data/catalog";

export const Route = createFileRoute("/bike-models/$slug")({
  loader: ({ params }) => {
    const model = getBikeModel(params.slug);
    if (!model) throw notFound();
    return { model };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Bike model unavailable — Customz Paradise BD" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.model.name} Modification Parts — Customz Paradise BD`;
    const description = `Premium modification parts and accessories for the ${loaderData.model.name}, with BDT pricing and delivery across Bangladesh.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/bike-models/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/bike-models/${params.slug}` }],
    };
  },
  component: BikeModelPage,
  notFoundComponent: ModelNotFound,
});

function BikeModelPage() {
  const { model } = Route.useLoaderData();
  const products = getProductsForBike(model.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/bike-models" className="hover:text-primary">
          Bike Models
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{model.name}</span>
      </nav>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <SafeImage
          src={model.image}
          alt={model.alt}
          width={1600}
          height={900}
          priority
          sizes="100vw"
          containerClassName="aspect-16/9 w-full"
        />
      </div>

      <h1 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        {model.name}
      </h1>
      <p className="mt-1 text-sm uppercase tracking-[0.2em] text-primary">{model.label}</p>

      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}

function ModelNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">Bike model not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This model page isn&apos;t available. Browse the full model list instead.
      </p>
      <Link
        to="/bike-models"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-gradient-red px-5 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground"
      >
        All bike models
      </Link>
    </div>
  );
}