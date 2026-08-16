import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { SafeImage } from "@/components/SafeImage";
import { SectionHeading } from "@/components/home/SectionHeading";
import { useLanguage } from "@/lib/i18n";
import type { BikeModel } from "@/data/types";

const AUTOPLAY_MS = 5000;

export function BikeModelCarousel({ models }: { models: BikeModel[] }) {
  const { t } = useLanguage();
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", dragFree: true, loop: false });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!embla) return;
    embla.on("pointerDown", () => setPaused(true));
  }, [embla]);

  useEffect(() => {
    if (!embla || paused || models.length < 3) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (embla.canScrollNext()) embla.scrollNext();
      else embla.scrollTo(0);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [embla, paused, models.length]);

  if (!models.length) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="bike-models"
    >
      <SectionHeading
        eyebrow={t("section.models.eyebrow")}
        title={t("section.models.title")}
        action={
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous bike models"
              onClick={() => {
                setPaused(true);
                embla?.scrollPrev();
              }}
              className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next bike models"
              onClick={() => {
                setPaused(true);
                embla?.scrollNext();
              }}
              className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        }
      />
      <h2 id="bike-models" className="sr-only">
        Explore by bike model
      </h2>

      <div className="overflow-hidden" ref={emblaRef}>
        <ul className="flex touch-pan-y gap-3 sm:gap-4 pb-1">
          {models.map((model) => (
            <li
              key={model.id}
              className="min-w-0 flex-[0_0_68%] sm:flex-[0_0_38%] lg:flex-[0_0_24%]"
            >
              <Link
                to="/bike-models/$slug"
                params={{ slug: model.slug }}
                className="group block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/60"
              >
                <SafeImage
                  src={model.image}
                  alt={model.alt || model.name}
                  width={600}
                  height={400}
                  aspectRatio="3/2"
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
                  containerClassName="aspect-[3/2] w-full"
                  className="transition-transform duration-700 group-hover:scale-105 object-contain p-4"
                />
                <div className="border-t border-border p-3">
                  <p className="truncate font-display text-base font-bold uppercase tracking-wide">
                    {model.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-primary">
                    {model.label}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
