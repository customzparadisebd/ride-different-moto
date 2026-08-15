// ============================================================
// 360° PRODUCT VIEWER
// Purpose: A lightweight image-sequence viewer that handles
//          dragging and swiping to rotate a product.
// Status: COMPLETED
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCw, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product360ViewerProps {
  images: string[];
  productName: string;
  onClose: () => void;
}

export function Product360Viewer({ images, productName, onClose }: Product360ViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const lastX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalImages = images.length;

  // Progressive loading: Load first, middle, and end frames first for quick visual feedback
  useEffect(() => {
    if (totalImages === 0) return;
    
    const priorityIndices = new Set([
      0, 
      Math.floor(totalImages / 4), 
      Math.floor(totalImages / 2), 
      Math.floor(3 * totalImages / 4)
    ]);
    
    const loadPriority = async () => {
      const priorityPromises = Array.from(priorityIndices).map(idx => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = images[idx];
        });
      });
      await Promise.all(priorityPromises);
      
      // After priority, load the rest
      let loadedCount = priorityIndices.size;
      setProgress(Math.round((loadedCount / totalImages) * 100));
      
      images.forEach((src, idx) => {
        if (priorityIndices.has(idx)) return;
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / totalImages) * 100));
          if (loadedCount === totalImages) setIsPreloaded(true);
        };
        img.onerror = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / totalImages) * 100));
          if (loadedCount === totalImages) setIsPreloaded(true);
        };
        img.src = src;
      });
    };

    loadPriority();
  }, [images, totalImages]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    lastX.current = clientX;
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || lastX.current === null) return;

    const deltaX = clientX - lastX.current;
    // Sensivity: pixels to move one frame
    const sensitivity = 10; 
    
    if (Math.abs(deltaX) > sensitivity) {
      const framesToMove = Math.floor(deltaX / sensitivity);
      
      setCurrentIndex((prev) => {
        let next = (prev - framesToMove) % totalImages;
        if (next < 0) next = totalImages + next;
        return next;
      });
      
      lastX.current = clientX;
    }
  }, [isDragging, totalImages]);

  const handleEnd = () => {
    setIsDragging(false);
    lastX.current = null;
  };

  // Global event listeners for smooth drag even if mouse leaves container
  useEffect(() => {
    if (!isDragging) return undefined;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onEnd = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, handleMove]);

  // Keyboard support for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % totalImages);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalImages, onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`360 degree view of ${productName}`}
    >
      <div className="relative flex h-full w-full flex-col p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight sm:text-2xl">
              360° View
            </h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {productName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
            onClick={onClose}
          >
            <X className="size-6" />
          </Button>
        </div>

        {/* Viewer Area */}
        <div className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-onyx/50 border border-white/5">
          {progress < 100 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-onyx/80">
              <RotateCw className="size-8 animate-spin text-primary mb-4" />
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">
                Loading Experience {progress}%
              </p>
            </div>
          )}

          <div
            ref={containerRef}
            className={cn(
              "relative aspect-square w-full max-w-[800px] cursor-grab select-none overflow-hidden touch-none",
              isDragging && "cursor-grabbing"
            )}
            onMouseDown={(e) => handleStart(e.clientX)}
            onTouchStart={(e) => {
              if (e.touches && e.touches[0]) {
                handleStart(e.touches[0].clientX);
              }
            }}
          >
            {images.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`${productName} frame ${index + 1}`}
                className={cn(
                  "absolute inset-0 h-full w-full object-contain transition-opacity duration-75",
                  index === currentIndex ? "opacity-100" : "opacity-0"
                )}
                draggable={false}
              />
            ))}
          </div>

          {/* Interaction Guide */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-md border border-white/10">
            <Hand className="size-3" />
            Drag or swipe to rotate
          </div>
        </div>

        {/* Footer controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
           <div className="h-1 flex-1 max-w-md overflow-hidden rounded-full bg-white/10">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalImages) * 100}%` }}
              />
           </div>
           <span className="font-mono text-[10px] text-muted-foreground uppercase">
             Frame {currentIndex + 1} / {totalImages}
           </span>
        </div>
      </div>
    </div>
  );
}
