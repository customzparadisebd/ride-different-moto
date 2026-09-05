import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLogos } from "@/lib/logos.functions";
import { SiteLogo, LogoCategory } from "@/lib/logos.shared";
import brandLogoMain from "@/assets/brand-logo-main.png";
import logo3dAsset from "@/assets/czp-logo-3d.png";
import czpLogoAsset from "@/assets/czp-logo.webp";
import logoDark from "@/assets/logo-dark-bg.png";

// Fallbacks based on category
const FALLBACKS: Record<LogoCategory, string> = {
  main: brandLogoMain,
  header: brandLogoMain,
  footer: brandLogoMain,
  mobile: brandLogoMain,
  admin_login: logo3dAsset,
  admin_sidebar: czpLogoAsset,
  invoice: logoDark,
  favicon: "/favicon.ico",
  og_image: "/logo-main.png",
};

export function useSiteLogos() {
  const list = useServerFn(listLogos);

  const { data: logos, isLoading } = useQuery({
    queryKey: ["site-logos-public"],
    queryFn: () => list({ data: undefined }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getLogo = (category: LogoCategory): string => {
    const logo = logos?.find(l => l.category === category && l.is_active);
    return logo?.url || FALLBACKS[category];
  };

  return { 
    logos, 
    isLoading, 
    getLogo,
    fallback: FALLBACKS 
  };
}
