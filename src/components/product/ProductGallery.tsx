import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  /** Image that should be shown as active (e.g. the selected colour's image). */
  activeColorImage?: string | null;
  /** Fired whenever the customer picks an image from the gallery/thumbnails. */
  onSelectImage?: (src: string) => void;
}

export function ProductGallery({
  images,
  productName,
  activeColorImage,
  onSelectImage,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const displayImages = images.length > 0 ? images : [""];

  useEffect(() => {
    if (activeIndex >= displayImages.length) {
      setActiveIndex(0);
    }
  }, [displayImages.length, activeIndex]);

  // Colour swatch -> gallery: move the gallery to the colour's image.
  useEffect(() => {
    if (!activeColorImage) return;
    const idx = displayImages.indexOf(activeColorImage);
    if (idx >= 0) setActiveIndex(idx);
  }, [activeColorImage, displayImages]);

  const select = (index: number) => {
    setActiveIndex(index);
    const src = displayImages[index];
    if (src) onSelectImage?.(src);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    select((activeIndex + 1) % displayImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    select((activeIndex - 1 + displayImages.length) % displayImages.length);
  };

  // Keyboard navigation for main gallery and fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      if (displayImages.length <= 1) return;
      if (e.key === "ArrowRight") {
        select((activeIndex + 1) % displayImages.length);
      } else if (e.key === "ArrowLeft") {
        select((activeIndex - 1 + displayImages.length) % displayImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayImages.length, isFullscreen, activeIndex]);

  const currentImage = displayImages[activeIndex] || activeColorImage || "";

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-card">
        <button
          type="button"
          className="h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setIsFullscreen(true)}
          aria-label={`View ${productName} in fullscreen`}
        >
          <SafeImage
            src={currentImage}
            alt={productName}
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            containerClassName="aspect-square w-full"
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </button>

        {/* Zoom Hint */}
        <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-foreground/10 p-2 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-5" />
        </div>

        {/* Navigation Arrows (Only if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Navigation */}
      {displayImages.length > 1 && (
        <div
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x"
          role="tablist"
          aria-label="Product images"
        >
          {displayImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              ref={(el) => {
                thumbnailRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${productName} thumbnail ${index + 1}`}
              onClick={() => select(index)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  const next = (index + 1) % displayImages.length;
                  thumbnailRefs.current[next]?.focus();
                  select(next);
                } else if (e.key === "ArrowLeft") {
                  const prev = (index - 1 + displayImages.length) % displayImages.length;
                  thumbnailRefs.current[prev]?.focus();
                  select(prev);
                }
              }}
              className={cn(
                "size-20 shrink-0 snap-start overflow-hidden rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                index === activeIndex
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:border-primary/40",
              )}
            >
              <SafeImage
                src={image}
                alt=""
                width={160}
                height={160}
                containerClassName="size-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-onyx/95 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={`${productName} image zoom`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-6 z-[110] size-12 text-onyx-foreground hover:bg-onyx-foreground/10"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close zoom"
            >
              <X className="size-8" />
            </Button>

            <div className="relative flex h-[85vh] w-[90vw] items-center justify-center md:h-[90vh]">
              <SafeImage
                src={currentImage}
                alt={productName}
                width={2000}
                height={2000}
                containerClassName="h-full w-full"
                className="object-contain"
              />

              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-onyx-foreground/10 p-4 text-onyx-foreground transition-colors hover:bg-onyx-foreground/20 focus:outline-none focus-visible:bg-onyx-foreground/30"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-10" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-onyx-foreground/10 p-4 text-onyx-foreground transition-colors hover:bg-onyx-foreground/20 focus:outline-none focus-visible:bg-onyx-foreground/30"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-10" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation in Fullscreen */}
            <div
              className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-4 py-2 scrollbar-none"
              role="tablist"
              aria-label="Zoomed product images"
            >
              {displayImages.map((image, index) => (
                <button
                  key={`fs-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`${productName} zoomed thumbnail ${index + 1}`}
                  onClick={() => select(index)}
                  className={cn(
                    "size-16 shrink-0 rounded-md border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    index === activeIndex ? "border-primary" : "border-onyx-foreground/20",
                  )}
                >
                  <SafeImage
                    src={image}
                    alt=""
                    width={100}
                    height={100}
                    containerClassName="size-full"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
