import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SafeImage } from "@/components/SafeImage";
import type { HeroSlide } from "@/data/types";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 2500;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    align: "start",
    watchDrag: true,
    skipSnaps: false,
  });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    onSelect();
    embla.on("select", onSelect);
    embla.on("pointerDown", () => setPaused(true));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPaused(true);
        embla.scrollPrev();
      } else if (e.key === "ArrowRight") {
        setPaused(true);
        embla.scrollNext();
      }
    };

    const node = embla.rootNode();
    node.addEventListener("keydown", onKeyDown);

    return () => {
      embla.off("select", onSelect);
      node.removeEventListener("keydown", onKeyDown);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla || paused || slides.length < 2) return;
    const timer = window.setInterval(() => embla.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [embla, paused, slides.length]);

  const scrollPrev = useCallback(() => {
    setPaused(true);
    embla?.scrollPrev();
  }, [embla]);

  const scrollNext = useCallback(() => {
    setPaused(true);
    embla?.scrollNext();
  }, [embla]);

  if (!slides.length) return null;

  return (
    <section
      aria-label="Featured motorcycle builds"
      className="relative bg-onyx"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="overflow-hidden"
        ref={emblaRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
      >
        <div className="flex touch-pan-y cursor-grab active:cursor-grabbing">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              <Link
                to={slide.bikeSlug === "all-products" ? "/" : "/bike-models/$slug"}
                params={slide.bikeSlug === "all-products" ? {} : ({ slug: slide.bikeSlug } as any)}
                className="group relative block"
                aria-label={slide.isFullBanner ? slide.alt : `${slide.bikeName} modification parts`}
              >
                <SafeImage
                  src={slide.image}
                  mobileSrc={slide.mobileImage}
                  alt={slide.alt}
                  width={1920}
                  height={822}
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
                  containerClassName={cn(
                    "w-full bg-onyx",
                    slide.isFullBanner
                      ? "aspect-[1000/1250] sm:aspect-[21/9]"
                      : "aspect-4/5 sm:aspect-16/9 lg:aspect-21/9",
                  )}
                  className="transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {!slide.isFullBanner && (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 pb-16 sm:p-8 sm:pb-20">
                      {slide.label && <p className="eyebrow text-white/70">{slide.label}</p>}
                      <h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
                        {slide.bikeName}
                      </h2>
                      <span className="mt-2 inline-block h-0.5 w-14 bg-gradient-red" />
                    </div>
                  </>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 sm:p-6">
          <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={selected === index}
                aria-label={`Show ${slide.bikeName}`}
                onClick={() => {
                  setPaused(true);
                  embla?.scrollTo(index);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  selected === index ? "w-8 bg-primary" : "w-4 bg-white/40 hover:bg-white/70",
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous slide"
              className="grid size-10 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next slide"
              className="grid size-10 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        Slide {selected + 1} of {slides.length}
      </div>
    </section>
  );
}
