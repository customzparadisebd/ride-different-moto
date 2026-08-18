import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import { ProductBrowser } from "@/components/ProductBrowser";
import { ProductGrid } from "@/components/ProductCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { Button } from "@/components/ui/button";

import { AboutSection } from "@/components/home/AboutSection";
import { BikeModelCarousel } from "@/components/home/BikeModelCarousel";
import { ContactSection } from "@/components/home/ContactSection";
import { HeroSlider } from "@/components/home/HeroSlider";
import { SectionHeading } from "@/components/home/SectionHeading";
import { SocialSection } from "@/components/home/SocialSection";

import { StoreComingSoon } from "@/components/home/StoreComingSoon";
import { getHeroSlides } from "@/lib/hero.functions";
import { getStorefrontBikeModels } from "@/lib/bike-models.functions";
import { storefrontProductsQuery } from "@/lib/storefront.queries";
import { getSectionSettings } from "@/lib/sections.functions";
import { site } from "@/data/site";
import { useLanguage } from "@/lib/i18n";
import { type SiteSettings } from "@/lib/settings.shared";
import type { SectionSetting } from "@/lib/sections.shared";

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => {
    const settings = (loaderData as any)?.siteSettings || site;
    const siteUrl = settings?.productionDomain ? `https://${settings.productionDomain}` : site.url;
    const businessName = settings?.businessName || (settings as any).name || site.name;
    const businessTagline = settings?.tagline || (settings as any).tagline || site.tagline;
    const businessDescription = settings?.businessDescription || (settings as any).description || site.description;
    const businessPhone = settings?.phone || (settings as any).phoneDisplay || site.phoneDisplay;
    const businessAddress = settings?.address || site.address;
    const businessCity = settings?.city || "Uttara";
    const businessEmail = settings?.email || site.email;

    const title = `${businessName} — ${businessTagline}`;
    const description = businessDescription;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: siteUrl },
        { rel: "canonical", href: siteUrl },
        { property: "og:image", content: `${siteUrl}/logo-main.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${siteUrl}/logo-main.png` },
      ],
      
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": businessName,
              "url": siteUrl,
              "logo": `${siteUrl}/logo-main.png`,
              "sameAs": site.socials.map((social) => social.href),
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": businessPhone,
                "contactType": "customer service",
                "areaServed": "BD",
                "availableLanguage": ["en", "bn"]
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": businessName,
              "image": `${siteUrl}/logo-main.png`,
              "@id": siteUrl,
              "url": siteUrl,
              "telephone": businessPhone,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": businessAddress,
                "addressLocality": businessCity,
                "addressRegion": "Dhaka",
                "postalCode": "1230",
                "addressCountry": "BD"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 23.8759,
                "longitude": 90.3795
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "09:00",
                "closes": "21:00"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Store",
              "name": businessName,
              "url": siteUrl,
              "telephone": businessPhone,
              "email": businessEmail,
              "slogan": businessTagline,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": `${businessCity}, Dhaka`,
                "postalCode": "1230",
                "addressCountry": "BD"
              },
              "sameAs": site.socials.map((social) => social.href)
            }
          ]),
        },
      ],
    };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(storefrontProductsQuery());
  },
  component: Index,
  errorComponent: ({ error }) => (
    <p
      role="alert"
      className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground"
    >
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <p className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
      Page not found.
    </p>
  ),
});

/**
 * Homepage Component
 * Renders the main storefront landing page sections.
 */
function Index() {
  const { t } = useLanguage();
  const fetchHeroSlides = useServerFn(getHeroSlides);
  const fetchBikeModels = useServerFn(getStorefrontBikeModels);
  const fetchSectionSettings = useServerFn(getSectionSettings);

  const heroSlidesQuery = useQuery({
    queryKey: ["hero-slides"],
    queryFn: () => fetchHeroSlides({ data: {} }),
    placeholderData: (prev) => prev,
  });

  const bikeModelsQuery = useQuery({
    queryKey: ["bike-models"],
    queryFn: () => fetchBikeModels(),
  });

  const sectionSettingsQuery = useQuery({
    queryKey: ["section-settings"],
    queryFn: () => fetchSectionSettings(),
  });

  const bikeModels = bikeModelsQuery.data || [];
  const { data: products } = useSuspenseQuery(storefrontProductsQuery());
  const sectionSettings = sectionSettingsQuery.data || [];

  const getSetting = (id: string) => sectionSettings.find((s) => s.id === id);

  const featuredDealsSetting = getSetting("featured_deals");
  const allProductsSetting = getSetting("all_products");

  const universalProducts = products.filter((product) => product.universal);
  
  const getDisplayProducts = (setting: SectionSetting | undefined, defaultLimit: number, fallbackFilter: (p: any) => boolean) => {
    if (!setting) return products.filter(fallbackFilter).slice(0, defaultLimit);
    
    let filtered = [...products];
    
    // If a category is explicitly set for the section, use it
    if (setting.productCategory) {
      filtered = filtered.filter(p => p.category === setting.productCategory);
    } else {
      // Fallback to the original section logic
      filtered = filtered.filter(fallbackFilter);
    }

    // Apply sorting for featured if not using a specific category
    if (!setting.productCategory && (setting.id === "featured_deals")) {
       filtered = filtered.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    }

    return filtered.slice(0, setting.displayLimit);
  };

  const bestDealsFilter = (p: any) => p.bestDeal || p.featured;
  const allProductsFilter = () => true;

  const bestDealsDisplay = getDisplayProducts(featuredDealsSetting, 6, bestDealsFilter);
  const allProductsDisplay = getDisplayProducts(allProductsSetting, 8, allProductsFilter);

  const getTotalCount = (setting: SectionSetting | undefined, fallbackFilter: (p: any) => boolean) => {
    if (setting?.productCategory) {
      return products.filter(p => p.category === setting.productCategory).length;
    }
    return products.filter(fallbackFilter).length;
  };

  const showFeaturedSeeAll = featuredDealsSetting?.showSeeAll && getTotalCount(featuredDealsSetting, bestDealsFilter) > (featuredDealsSetting?.displayLimit ?? 6);
  const showAllProductsSeeAll = allProductsSetting?.showSeeAll && getTotalCount(allProductsSetting, allProductsFilter) > (allProductsSetting?.displayLimit ?? 8);

  return (
    <>
      <h1 className="sr-only">
        Customz Paradise BD — Premium Motorcycle Modification Parts, Stickers & Accessories in Bangladesh
      </h1>

      <SectionBoundary label="hero">
        <HeroSlider slides={heroSlidesQuery.data || []} />
      </SectionBoundary>

      <SectionBoundary label="bike-models">
        <BikeModelCarousel models={bikeModels} />
      </SectionBoundary>

      <SectionBoundary label="universal-products">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeading
            eyebrow={t("section.universal.eyebrow")}
            title={t("section.universal.title")}
          />
          <ProductGrid products={universalProducts} />
        </section>
      </SectionBoundary>

      {(!featuredDealsSetting || featuredDealsSetting.enabled) && (
        <SectionBoundary label="best-deals">
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
            <SectionHeading
              eyebrow={t("section.bestDeals.eyebrow")}
              title={featuredDealsSetting?.name || t("section.bestDeals.title")}
              action={showFeaturedSeeAll && (
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 hover:bg-primary/5 transition-all group">
                  <Link to={featuredDealsSetting?.buttonLink || "/shop"}>
                    {featuredDealsSetting?.buttonText || "See All"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
            />
            <ProductGrid products={bestDealsDisplay} />
          </section>
        </SectionBoundary>
      )}

      {(!allProductsSetting || allProductsSetting.enabled) && (
        <SectionBoundary label="all-products">
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
            <SectionHeading
              eyebrow={`${products.length} ${t("section.allProducts.eyebrow")}`}
              title={allProductsSetting?.name || t("section.allProducts.title")}
              action={showAllProductsSeeAll && (
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 hover:bg-primary/5 transition-all group">
                  <Link to={allProductsSetting?.buttonLink || "/shop"}>
                    {allProductsSetting?.buttonText || "See All Products"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
            />
            <ProductBrowser products={allProductsDisplay} />
            
            {showAllProductsSeeAll && (
              <div className="mt-12 flex justify-center">
                <Button variant="outline" size="lg" asChild className="shadow-3d hover:translate-y-[-2px] active:translate-y-[1px] transition-all border-white/10 text-white hover:bg-white/5 font-display uppercase tracking-wider">
                  <Link to={allProductsSetting?.buttonLink || "/shop"}>
                    {allProductsSetting?.buttonText || "See All Products"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}
          </section>
        </SectionBoundary>
      )}

      <SectionBoundary label="about">
        <AboutSection />
      </SectionBoundary>

      <SectionBoundary label="store">
        <StoreComingSoon />
      </SectionBoundary>

      <SectionBoundary label="contact">
        <ContactSection />
      </SectionBoundary>

      <SectionBoundary label="social">
        <SocialSection />
      </SectionBoundary>
    </>
  );
}
