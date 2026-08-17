import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { ProductBrowser } from "@/components/ProductBrowser";
import { ProductGrid } from "@/components/ProductCard";
import { SectionBoundary } from "@/components/SectionBoundary";

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
import { site } from "@/data/site";
import { useLanguage } from "@/lib/i18n";
import { type SiteSettings } from "@/lib/settings.shared";

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
        { property: "og:image", content: `${siteUrl}/logo-main.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${siteUrl}/logo-main.png` },
      ],
      links: [{ rel: "canonical", href: siteUrl }],
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

  const heroSlidesQuery = useQuery({
    queryKey: ["hero-slides"],
    queryFn: () => fetchHeroSlides({ data: {} }),
    placeholderData: (prev) => prev,
  });

  const bikeModelsQuery = useQuery({
    queryKey: ["bike-models"],
    queryFn: () => fetchBikeModels(),
  });

  const bikeModels = bikeModelsQuery.data || [];
  // ALL PRODUCTS SECTION
  // Purpose: Displays all active products dynamically from the database.
  // Status: COMPLETED
  const { data: products } = useSuspenseQuery(storefrontProductsQuery());
  const universalProducts = products.filter((product) => product.universal);
  const bestDeals = products
    .filter((product) => product.bestDeal || product.featured)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

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

      <SectionBoundary label="best-deals">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeading
            eyebrow={t("section.bestDeals.eyebrow")}
            title={t("section.bestDeals.title")}
          />
          <ProductGrid products={bestDeals} />
        </section>
      </SectionBoundary>

      <SectionBoundary label="all-products">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeading
            eyebrow={`${products.length} ${t("section.allProducts.eyebrow")}`}
            title={t("section.allProducts.title")}
          />
          {/* PRODUCT SEARCH & FILTERS — COMPLETED */}
          <ProductBrowser products={products} />
        </section>
      </SectionBoundary>

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
