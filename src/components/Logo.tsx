import brandLogoMain from "@/assets/brand-logo-main.png.asset.json";
import { site } from "@/data/site";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "auto" follows the active theme; force a version when the surface is fixed. */
  on?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
};

/**
 * Brand mark, used exactly as supplied. Height is constrained and width is auto,
 * so the original proportions are always preserved.
 */
export function Logo({ on = "auto", className, priority = false }: LogoProps) {
  const { theme } = useTheme();
  const surface = on === "auto" ? theme : on;
  const asset = brandLogoMain;

  return (
    <img
      src={asset.url}
      alt={`${site.name} logo`}
      width={480}
      height={168}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      className={cn("h-9 w-auto object-contain", className)}
    />
  );
}
