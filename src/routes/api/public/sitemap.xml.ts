import { createFileRoute } from "@tanstack/react-router";
import { getProducts } from "@/data/catalog";
import { site } from "@/data/site";

export const Route = createFileRoute("/api/public/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = getProducts();
        const lastMod = new Date().toISOString().split("T")[0];

        const urls = [
          { loc: site.url, priority: "1.0" },
          { loc: `${site.url}/all-products`, priority: "0.8" },
          ...products.map((p) => ({
            loc: `${site.url}/products/${p.slug}`,
            priority: "0.7",
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
