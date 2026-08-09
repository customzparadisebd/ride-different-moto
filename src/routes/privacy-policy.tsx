import { createFileRoute, notFound } from "@tanstack/react-router";

import { PolicyArticle } from "@/components/PolicyPage";
import { getPolicy } from "@/data/catalog";

const policy = getPolicy("privacy-policy");

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: `${policy?.title ?? "Policy"} — Customz Paradise BD` },
      { name: "description", content: policy?.summary ?? "Customz Paradise BD policy." },
      { property: "og:title", content: `${policy?.title ?? "Policy"} — Customz Paradise BD` },
      { property: "og:description", content: policy?.summary ?? "Customz Paradise BD policy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: Page,
});

function Page() {
  if (!policy) throw notFound();
  return <PolicyArticle policy={policy} />;
}
