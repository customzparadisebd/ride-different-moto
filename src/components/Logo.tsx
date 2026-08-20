import { site } from "@/data/site";
import { useSiteLogos } from "@/hooks/use-site-logos";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "auto" follows the active theme; force a version when the surface is fixed. */
  on?: "auto" | "light" | "dark"; // kept for backward compatibility if needed, but we use dynamic logos now
  className?: string;
  priority?: boolean;
  category?: "main" | "header" | "footer" | "mobile";
};

/**
 * Brand mark, used exactly as supplied. Height is constrained and width is auto,
 * so the original proportions are always preserved.
 */
export function Logo({ className, priority = false, category = "main" }: LogoProps) {
  const { getLogo } = useSiteLogos();
  const logoUrl = getLogo(category);

  return (
    <img
      src={logoUrl}
      alt={`${site.name} logo`}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      className={cn(
        "h-8 w-auto object-contain sm:h-9 md:h-10", 
        className && className.replace(/h-\d+|w-auto/g, "").trim(),
        className
      )}
    />
  );
}

