import { createFileRoute } from "@tanstack/react-router";

import { ContactSection } from "@/components/home/ContactSection";
import { SocialSection } from "@/components/home/SocialSection";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

const title = "Contact Us — Customz Paradise BD";
const description =
  "Reach Customz Paradise BD on WhatsApp, phone or email for motorcycle modification parts in Bangladesh.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="eyebrow text-primary">Support</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Contact Us
        </h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="red" size="touch" asChild>
            <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp Us
            </a>
          </Button>
          <Button variant="steel" size="touch" asChild>
            <a href={site.phoneHref}>Call {site.phoneDisplay}</a>
          </Button>
        </div>
      </div>
      <ContactSection />
      <SocialSection />
    </div>
  );
}
