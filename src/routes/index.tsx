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
import { ReviewSection } from "@/components/home/ReviewSection";
import { StoreComingSoon } from "@/components/home/StoreComingSoon";
import { getBikeModels } from "@/data/catalog";
import { getHeroSlides } from "@/lib/hero.functions";
import { storefrontProductsQuery } from "@/lib/storefront.queries";
import { site } from "@/data/site";

const title = "Customz Paradise BD — Premium Motorcycle Modification Parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: site.description },
      { property: "og:title", content: title },
      { property: "og:description", content: site.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: site.name,
          slogan: site.tagline,
          telephone: site.phoneDisplay,
          email: site.email,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Uttara, Dhaka",
            postalCode: "1230",
            addressCountry: "BD",
          },
          sameAs: site.socials.map((social) => social.href),
        }),
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(storefrontProductsQuery());
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

function Index() {
  const fetchHeroSlides = useServerFn(getHeroSlides);
  const heroSlidesQuery = useQuery({ 
    queryKey: ["hero-slides"], 
    queryFn: () => fetchHeroSlides({ data: {} }),
    placeholderData: (prev) => prev
  });
  const bikeModels = getBikeModels();
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
        {site.name} — premium motorcycle modification parts and accessories in Bangladesh
      </h1>

      <SectionBoundary label="hero">
        <HeroSlider slides={heroSlidesQuery.data || []} />
      </SectionBoundary>

      <SectionBoundary label="bike-models">
        <BikeModelCarousel models={bikeModels} />
      </SectionBoundary>

      <SectionBoundary label="universal-products">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeading eyebrow="Fits most bikes" title="Universal Products" />
          <ProductGrid products={universalProducts} />
        </section>
      </SectionBoundary>

      <SectionBoundary label="best-deals">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeading eyebrow="Limited offers" title="Featured & Best Deals" />
          <ProductGrid products={bestDeals} />
        </section>
      </SectionBoundary>

      <SectionBoundary label="all-products">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeading eyebrow={`${products.length} products`} title="All Products" />
          {/* PRODUCT SEARCH & FILTERS — COMPLETED */}
          <ProductBrowser products={products} />
        </section>
      </SectionBoundary>

      <SectionBoundary label="store">
        <StoreComingSoon />
      </SectionBoundary>

      <SectionBoundary label="about">
        <AboutSection />
      </SectionBoundary>

      <SectionBoundary label="reviews">
        <ReviewSection />
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
