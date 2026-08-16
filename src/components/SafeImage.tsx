import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { regenerateMissingVariants } from "@/lib/images.functions";
import { useServerFn } from "@tanstack/react-start";

type SafeImageProps = {
  src: string;
  mobileSrc?: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  /** Optional custom srcSet, otherwise generated automatically */
  srcSet?: string;
  /** Optional blurred placeholder data URL */
  blurDataURL?: string;
  /** Whether to use a fixed aspect ratio container to prevent CLS */
  fixedAspectRatio?: boolean;
};

const MAX_RETRIES = 3;

/**
 * Image with a reserved box, loading shimmer and per-image retry.
 * A failed image never reloads the page and never triggers an infinite retry loop.
 */
export function SafeImage({
  src,
  mobileSrc,
  alt,
  width,
  height,
  aspectRatio,
  className,
  containerClassName,
  priority = false,
  fetchPriority,
  sizes = "100vw",
  srcSet,
  blurDataURL,
  fixedAspectRatio = true,
}: SafeImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  const triggerRegeneration = useServerFn(regenerateMissingVariants);
  const regenerationTracker = useRef<Set<string>>(new Set());

  // Images that finish before hydration never fire React's onLoad, so sync
  // from the DOM node and attach native listeners as a fallback.
  const previousSrc = useRef(src);
  if (previousSrc.current !== src) {
    previousSrc.current = src;
    setAttempt(0);
    setStatus("loading");
  }

  useEffect(() => {
    const node = imgRef.current;
    if (!node) return;
    if (node.complete) {
      setStatus(node.naturalWidth > 0 ? "loaded" : "error");
      return;
    }
    const onLoad = () => setStatus("loaded");
    const onError = () => setStatus("error");
    node.addEventListener("load", onLoad);
    node.addEventListener("error", onError);
    return () => {
      node.removeEventListener("load", onLoad);
      node.removeEventListener("error", onError);
    };
  }, [attempt, src]);

  const retry = useCallback(() => {
    setAttempt((current) => {
      if (current >= MAX_RETRIES) return current;
      
      // If we are retrying, check if the error was a 404/failure for a specific variant
      // and trigger a regeneration request in the background
      if (src.includes(".supabase.co/storage/v1/object/public/") || src.includes(".lovableproject.com/")) {
        const formats: ("avif" | "webp")[] = ["avif", "webp"];
        const widths = [400, 640, 800, 1200, 1920];
        
        formats.forEach(format => {
          widths.forEach(w => {
            const key = `${src}-${format}-${w}`;
            if (!regenerationTracker.current.has(key)) {
              regenerationTracker.current.add(key);
              triggerRegeneration({ data: { src, format, width: w } }).catch(() => {});
            }
          });
        });
      }

      setStatus("loading");
      return current + 1;
    });
  }, [src, triggerRegeneration]);

  // Recover automatically once the browser reports the network is back.
  useEffect(() => {
    if (status !== "error") return;
    const onOnline = () => retry();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [status, retry]);

  const canRetry = attempt < MAX_RETRIES;

  return (
    <div
      className={cn("relative overflow-hidden bg-muted", containerClassName)}
      style={{
        aspectRatio: fixedAspectRatio ? (aspectRatio || (width && height ? `${width} / ${height}` : "1/1")) : undefined,
      }}
    >
      {/* 4. Blur-up placeholder effect */}
      {(status === "loading" || status === "error") && blurDataURL && (
        <div
          className="absolute inset-0 z-0 scale-110 blur-2xl transition-opacity duration-500"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: status === "loading" ? 1 : 0,
          }}
        />
      )}

      {status !== "error" && (
        <picture className="contents">
          {/* 1 & 2. Responsive delivery and format optimization (AVIF then WebP) */}
          {mobileSrc && (
            <>
              <source
                media="(max-width: 640px)"
                srcSet={`${mobileSrc}?w=400&format=avif&q=70 400w, ${mobileSrc}?w=640&format=avif&q=70 640w, ${mobileSrc}?w=1280&format=avif&q=50 1280w`}
                type="image/avif"
                sizes="(max-width: 640px) 100vw, 400px"
              />
              <source
                media="(max-width: 640px)"
                srcSet={`${mobileSrc}?w=400&format=webp&q=80 400w, ${mobileSrc}?w=640&format=webp&q=80 640w, ${mobileSrc}?w=1280&format=webp&q=60 1280w`}
                type="image/webp"
                sizes="(max-width: 640px) 100vw, 400px"
              />
            </>
          )}

          {/* Desktop/Default sources */}
          <source
            srcSet={
              srcSet ||
              `${src}?w=640&format=avif&q=75 640w, ${src}?w=800&format=avif&q=75 800w, ${src}?w=1200&format=avif&q=75 1200w, ${src}?w=1920&format=avif&q=60 1920w`
            }
            type="image/avif"
            sizes={sizes}
          />
          <source
            srcSet={
              srcSet ||
              `${src}?w=640&format=webp&q=85 640w, ${src}?w=800&format=webp&q=85 800w, ${src}?w=1200&format=webp&q=85 1200w, ${src}?w=1920&format=webp&q=70 1920w`
            }
            type="image/webp"
            sizes={sizes}
          />

          <img
            key={attempt}
            ref={imgRef}
            src={attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}r=${attempt}`}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            // 3. Native Lazy Loading
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={fetchPriority || (priority ? "high" : "auto")}
            draggable={false}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-700 ease-in-out relative z-10",
              status === "loaded" ? "opacity-100" : "opacity-0",
              className,
            )}
          />
        </picture>
      )}

      {status === "loading" && !blurDataURL && (
        <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-br from-muted via-secondary/20 to-muted" />
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary px-4 text-center">
          <p className="text-xs font-semibold text-foreground">Image couldn&apos;t load</p>
          {canRetry ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                retry();
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary"
            >
              Tap to retry
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Check your connection</p>
          )}
        </div>
      )}
    </div>
  );
}
