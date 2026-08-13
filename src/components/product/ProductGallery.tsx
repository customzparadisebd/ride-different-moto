import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  activeColorImage?: string | null;
}

export function ProductGallery({ images, productName, activeColorImage }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // If a color image is provided, we prioritize it as the primary view
  // but we still want to allow navigating the full gallery.
  const displayImages = images.length > 0 ? images : [""];
  
  useEffect(() => {
    // Reset index if images change significantly, though usually images are stable
    if (activeIndex >= displayImages.length) {
      setActiveIndex(0);
    }
  }, [displayImages.length, activeIndex]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const currentImage = activeColorImage || displayImages[activeIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div 
        className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-card"
        onClick={() => setIsFullscreen(true)}
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
        
        {/* Zoom Hint */}
        <div className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-5" />
        </div>

        {/* Navigation Arrows (Only if multiple images) */}
        {displayImages.length > 1 && !activeColorImage && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Navigation */}
      {displayImages.length > 1 && (
        <div className="flex snap-x gap-2 overflow-x-auto pb-2 scrollbar-none">
          {displayImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                // If we were showing a color image, clear it by setting active index
              }}
              className={cn(
                "size-20 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-all",
                index === activeIndex && !activeColorImage
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <SafeImage
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
            onClick={() => setIsFullscreen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-6 size-12 text-white hover:bg-white/10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="size-8" />
            </Button>

            <div className="relative h-[85vh] w-[90vw] md:h-[90vh]">
              <SafeImage
                src={currentImage}
                alt={productName}
                width={2000}
                height={2000}
                containerClassName="h-full w-full"
                className="object-contain"
              />
              
              {displayImages.length > 1 && !activeColorImage && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="size-10" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white hover:bg-white/20"
                  >
                    <ChevronRight className="size-10" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation in Fullscreen */}
            <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-4 py-2" onClick={e => e.stopPropagation()}>
               {displayImages.map((image, index) => (
                <button
                  key={`fs-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "size-16 shrink-0 rounded-md border-2 overflow-hidden transition-all",
                    index === activeIndex ? "border-primary" : "border-white/20"
                  )}
                >
                  <SafeImage src={image} alt="" width={100} height={100} containerClassName="size-full" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
