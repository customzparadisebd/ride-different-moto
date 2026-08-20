import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLogos } from "@/lib/logos.functions";
import { SiteLogo, LogoCategory } from "@/lib/logos.shared";
import brandLogoMain from "@/assets/brand-logo-main.png.asset.json";
import logo3dAsset from "@/assets/czp-logo-3d.png.asset.json";
import czpLogoAsset from "@/assets/czp-logo.png.asset.json";
import logoDark from "@/assets/logo-dark-bg.png.asset.json";

// Fallbacks based on category
const FALLBACKS: Record<LogoCategory, string> = {
  main: brandLogoMain.url,
  header: brandLogoMain.url,
  footer: brandLogoMain.url,
  mobile: brandLogoMain.url,
  admin_login: logo3dAsset.url,
  admin_sidebar: czpLogoAsset.url,
  invoice: logoDark.url,
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
