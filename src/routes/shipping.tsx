import { createFileRoute, notFound } from "@tanstack/react-router";

import { PolicyArticle } from "@/components/PolicyPage";
import { getPolicy } from "@/data/catalog";
import { site } from "@/data/site";

const policy = getPolicy("shipping");

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: `${policy?.title ?? "Policy"} — Customz Paradise BD` },
      { name: "description", content: policy?.summary ?? "Customz Paradise BD policy." },
      { property: "og:title", content: `${policy?.title ?? "Policy"} — Customz Paradise BD` },
      { property: "og:description", content: policy?.summary ?? "Customz Paradise BD policy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/shipping` },
    ],
    links: [{ rel: "canonical", href: `${site.url}/shipping` }],
  }),
  component: Page,
});

function Page() {
  if (!policy) throw notFound();
  return <PolicyArticle policy={policy} />;
}
