import { createFileRoute } from "@tanstack/react-router";

import { ProductGrid } from "@/components/ProductCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { AboutSection } from "@/components/home/AboutSection";
import { BikeModelCarousel } from "@/components/home/BikeModelCarousel";
import { ContactSection } from "@/components/home/ContactSection";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { SectionHeading } from "@/components/home/SectionHeading";
import { SocialSection } from "@/components/home/SocialSection";
import { StoreComingSoon } from "@/components/home/StoreComingSoon";
import { TrustSection } from "@/components/home/TrustSection";
import {
  getBestDeals,
  getBikeModels,
  getHeroSlides,
  getReviews,
  getUniversalProducts,
} from "@/data/catalog";
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
  component: Index,
});

function Index() {
  const heroSlides = getHeroSlides();
  const bikeModels = getBikeModels();
  const universalProducts = getUniversalProducts();
  const bestDeals = getBestDeals();
  const reviews = getReviews();

  return (
    <>
      <h1 className="sr-only">
        {site.name} — premium motorcycle modification parts and accessories in Bangladesh
      </h1>

      <SectionBoundary label="hero">
        <HeroSlider slides={heroSlides} />
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

      <SectionBoundary label="trust">
        <TrustSection />
      </SectionBoundary>

      <SectionBoundary label="reviews">
        <ReviewsSection reviews={reviews} />
      </SectionBoundary>

      <SectionBoundary label="store">
        <StoreComingSoon />
      </SectionBoundary>

      <SectionBoundary label="about">
        <AboutSection />
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
