import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SafeImageProps = {
  src: string;
  mobileSrc?: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  /** Optional custom srcSet, otherwise generated automatically */
  srcSet?: string;
  /** Optional blurred placeholder data URL */
  blurDataURL?: string;
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
  className,
  containerClassName,
  priority = false,
  sizes = "100vw",
  srcSet,
  blurDataURL,
}: SafeImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

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
      setStatus("loading");
      return current + 1;
    });
  }, []);

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
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {/* 4. Blur-up placeholder effect */}
      {(status === "loading" || status === "error") && blurDataURL && (
        <div 
          className="absolute inset-0 z-0 scale-110 blur-2xl transition-opacity duration-500"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: status === "loading" ? 1 : 0
          }}
        />
      )}

      {status !== "error" && (
        <picture className="contents">
          {/* 1 & 2. Responsive delivery and format optimization */}
          {mobileSrc && (
            <source 
              media="(max-width: 640px)" 
              srcSet={`${mobileSrc}?w=640&format=webp&q=80 1x, ${mobileSrc}?w=1280&format=webp&q=60 2x`} 
              type="image/webp"
            />
          )}
          
          <source 
            srcSet={srcSet || `${src}?w=${width}&format=webp&q=80 1x, ${src}?w=${width * 2}&format=webp&q=60 2x`}
            type="image/webp"
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
            fetchPriority={priority ? "high" : "auto"}
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
