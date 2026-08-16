import { Link, createFileRoute } from "@tanstack/react-router";

import { SafeImage } from "@/components/SafeImage";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStorefrontBikeModels } from "@/lib/bike-models.functions";
import { site } from "@/data/site";

const title = "Bike Models — Customz Paradise BD";
const description =
  "Find motorcycle modification parts by bike model — Pulsar, R15, MT-15, Duke and more.";

export const Route = createFileRoute("/bike-models/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/bike-models` },
    ],
    links: [{ rel: "canonical", href: `${site.url}/bike-models` }],
  }),
  component: BikeModelsPage,
});

function BikeModelsPage() {
  const models = getBikeModels();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-primary">Find your fit</p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        Bike Models
      </h1>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {models.map((model) => (
          <li key={model.id}>
            <Link
              to="/bike-models/$slug"
              params={{ slug: model.slug }}
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/60"
            >
              <SafeImage
                src={model.image}
                alt={model.alt}
                width={800}
                height={600}
                sizes="(max-width: 640px) 50vw, 25vw"
                containerClassName="aspect-4/3 w-full"
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="border-t border-border p-3">
                <p className="truncate font-display text-base font-bold uppercase tracking-wide">
                  {model.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {model.label}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
