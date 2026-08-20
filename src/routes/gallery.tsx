import { createFileRoute } from "@tanstack/react-router";

import { SafeImage } from "@/components/SafeImage";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGalleryItems } from "@/lib/gallery.functions";
import { site } from "@/data/site";

const title = "Modified Motorcycle Builds Gallery Bangladesh — Customz Paradise BD";
const description =
  "Explore our gallery of modified motorcycle builds, custom visual setups, and premium parts installations in Bangladesh. Ride Different. Be Different.";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/gallery` },
    ],
    links: [{ rel: "canonical", href: `${site.url}/gallery` }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const fetchGallery = useServerFn(getGalleryItems);
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gallery-items"],
    queryFn: () => fetchGallery({ data: { admin: false } }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="eyebrow text-primary">Builds</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Gallery
        </h1>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow text-primary">Builds</p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        Gallery
      </h1>

      {items.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-border group bg-card">
              <SafeImage
                src={item.image}
                alt={item.alt}
                width={800}
                height={800}
                sizes="(max-width: 640px) 50vw, 33vw"
                containerClassName="aspect-square w-full"
                className="transition-transform duration-500 group-hover:scale-110"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-20 text-center">
          <p className="text-muted-foreground">No gallery items found.</p>
        </div>
      )}
    </div>
  );
}
