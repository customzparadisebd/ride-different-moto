import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { ProductGrid } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { getBikeModel } from "@/data/catalog";
import { storefrontProductsQuery } from "@/lib/storefront.queries";

export const Route = createFileRoute("/bike-models/$slug")({
  loader: ({ params, context }) => {
    const model = getBikeModel(params.slug);
    if (!model) throw notFound();
    void context.queryClient.ensureQueryData(storefrontProductsQuery());
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
  errorComponent: ({ error }) => (
    <p role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
      {error.message}
    </p>
  ),
  notFoundComponent: ModelNotFound,
});

function BikeModelPage() {
  const { model } = Route.useLoaderData();
  const { data: catalog } = useSuspenseQuery(storefrontProductsQuery());
  // Model page shows universal parts plus anything listing this bike.
  const products = catalog.filter(
    (product) => product.universal || product.bikeCompatibility.includes(model.name),
  );

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