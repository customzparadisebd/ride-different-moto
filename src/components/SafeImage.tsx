import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type SafeImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Container class controls the reserved aspect box so failures never shift layout. */
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
};

const MAX_RETRIES = 3;

/**
 * Image with a reserved box, loading shimmer and per-image retry.
 * A failed image never reloads the page and never triggers an infinite retry loop.
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  priority = false,
  sizes = "100vw",
}: SafeImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setAttempt(0);
    setStatus("loading");
  }, [src]);

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
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      {status !== "error" && (
        <img
          key={attempt}
          src={attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}r=${attempt}`}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            status === "loaded" ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}

      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-secondary to-muted" />
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