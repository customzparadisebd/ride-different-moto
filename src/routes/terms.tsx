import { createFileRoute, notFound } from "@tanstack/react-router";

import { PolicyArticle } from "@/components/PolicyPage";
import { getPolicy } from "@/data/catalog";
import { site } from "@/data/site";

const policy = getPolicy("terms");

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `${policy?.title ?? "Policy"} — Customz Paradise BD` },
      { name: "description", content: policy?.summary ?? "Customz Paradise BD policy." },
      { property: "og:title", content: `${policy?.title ?? "Policy"} — Customz Paradise BD` },
      { property: "og:description", content: policy?.summary ?? "Customz Paradise BD policy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site.url}/terms` },
    ],
    links: [{ rel: "canonical", href: `${site.url}/terms` }],
  }),
  component: Page,
});

function Page() {
  if (!policy) throw notFound();
  return <PolicyArticle policy={policy} />;
}
