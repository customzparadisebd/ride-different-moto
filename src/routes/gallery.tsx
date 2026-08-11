import { createFileRoute } from "@tanstack/react-router";

import { SafeImage } from "@/components/SafeImage";
import { getBikeModels, getHeroSlides } from "@/data/catalog";

const title = "Gallery — Customz Paradise BD";
const description =
  "Modified motorcycle builds and modification setups by Customz Paradise BD in Bangladesh.";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const items = [
    ...getHeroSlides().map((slide) => ({ id: slide.id, image: slide.image, alt: slide.alt })),
    ...getBikeModels().map((model) => ({ id: model.id, image: model.image, alt: model.alt })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-primary">Builds</p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        Gallery
      </h1>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-xl border border-border">
            <SafeImage
              src={item.image}
              alt={item.alt}
              width={800}
              height={800}
              sizes="(max-width: 640px) 50vw, 33vw"
              containerClassName="aspect-square w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
