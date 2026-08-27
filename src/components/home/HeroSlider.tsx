import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SafeImage } from "@/components/SafeImage";
import type { HeroSlide } from "@/data/types";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 2500;
const RESUME_MS = 2500;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    align: "start",
    watchDrag: true,
    skipSnaps: false,
    dragFree: false, // Enforce snapping for hero banners
    duration: 35, // Faster, punchier transitions
    dragThreshold: 5, // More sensitive for easier swiping
  });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);

  // Pause briefly on manual interaction, then always resume autoplay.
  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    onSelect();
    embla.on("select", onSelect);
    const onPointerDown = () => pauseThenResume();
    embla.on("pointerDown", onPointerDown);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        pauseThenResume();
        embla.scrollPrev();
      } else if (e.key === "ArrowRight") {
        pauseThenResume();
        embla.scrollNext();
      }
    };

    const node = embla.rootNode();
    node.addEventListener("keydown", onKeyDown);

    return () => {
      embla.off("select", onSelect);
      embla.off("pointerDown", onPointerDown);
      node.removeEventListener("keydown", onKeyDown);
    };
  }, [embla, pauseThenResume]);

  useEffect(() => {
    if (!embla || paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => embla.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [embla, paused, slides.length]);

  const scrollPrev = useCallback(() => {
    pauseThenResume();
    embla?.scrollPrev();
  }, [embla, pauseThenResume]);

  const scrollNext = useCallback(() => {
    pauseThenResume();
    embla?.scrollNext();
  }, [embla, pauseThenResume]);

  if (!slides.length) return null;

  return (
    <section
      aria-label="Premium Motorcycle Parts Showcase"
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
        <div className="flex touch-pan-y cursor-grab active:cursor-grabbing will-change-transform">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              <Link
                to={slide.bikeSlug === "all-products" || !slide.bikeSlug ? "/" : "/bike-models/$slug"}
                params={slide.bikeSlug === "all-products" || !slide.bikeSlug ? {} : ({ slug: slide.bikeSlug } as any)}
                className="group relative block"
                aria-label={slide.isFullBanner ? slide.alt : `${slide.bikeName} modification parts`}
              >
                <SafeImage
                  src={slide.image}
                  mobileSrc={slide.mobileImage}
                  alt={slide.alt || `${slide.bikeName} modification showcase`}
                  width={1920}
                  height={1080}
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  sizes="100vw"
                  containerClassName={cn(
                    "w-full bg-onyx",
                    slide.isFullBanner
                      ? "aspect-[3/4] sm:aspect-21/9"
                      : "aspect-[4/5] sm:aspect-16/9 lg:aspect-21/9",
                  )}
                  className="transition-transform duration-1000 group-hover:scale-105 object-cover"
                />
                {!slide.isFullBanner && (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 pb-16 sm:p-10 sm:pb-24">
                      {slide.label && (
                        <p className="eyebrow text-white/70 text-[10px] sm:text-xs">
                          {slide.label}
                        </p>
                      )}
                      <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                        {slide.bikeName}
                      </h2>
                      <span className="mt-4 inline-block h-1 w-20 bg-gradient-red" />
                    </div>
                  </>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Navigation Arrows - Far left and right */}
      <div className="hidden sm:block">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight className="size-6" aria-hidden="true" />
        </button>
      </div>

      {/* Pagination Dots - Bottom Center */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={selected === index}
              aria-label={`Show ${slide.bikeName || 'Slide ' + (index + 1)}`}
              onClick={() => {
                setPaused(true);
                embla?.scrollTo(index);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                selected === index 
                  ? "w-8 bg-white" 
                  : "w-1.5 bg-white/40 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              )}
            />
          ))}
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        Slide {selected + 1} of {slides.length}
      </div>
    </section>
  );
}
