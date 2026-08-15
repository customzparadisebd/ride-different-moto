import { createFileRoute } from "@tanstack/react-router";

import { AboutSection } from "@/components/home/AboutSection";
import { StoreComingSoon } from "@/components/home/StoreComingSoon";
import { TrustSection } from "@/components/home/TrustSection";
import { site } from "@/data/site";

const title = "About Customz Paradise BD — Motorcycle Modification Experts in Bangladesh";
const description =
  "Learn about Customz Paradise BD, the leading premium motorcycle modification brand in Bangladesh. Quality parts, unique builds, and rider-focused service.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/about` },
    ],
    links: [{ rel: "canonical", href: `${site.url}/about` }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="eyebrow text-primary">Our story</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          About Customz Paradise BD
        </h1>
      </div>
      <AboutSection />
      <TrustSection />
      <StoreComingSoon />
    </div>
  );
}
