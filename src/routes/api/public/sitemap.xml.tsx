import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/data/site";

export const Route = createFileRoute("/api/public/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        
        // Fetch active products from DB
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("slug, updated_at")
          .eq("is_active", true)
          .is("deleted_at", null);

        const lastMod = new Date().toISOString().split("T")[0];

        const urls = [
          { loc: site.url, priority: "1.0", lastmod: lastMod },
          { loc: \`\${site.url}/shop\`, priority: "0.8", lastmod: lastMod },
          ...(products || []).map((p) => ({
            loc: \`\${site.url}/products/\${p.slug}\`,
            priority: "0.7",
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : lastMod,
          })),
        ];

        const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\${urls
  .map(
    (u) => \`  <url>
    <loc>\${u.loc}</loc>
    <lastmod>\${u.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>\${u.priority}</priority>
  </url>\`
  )
  .join("\\n")}
</urlset>\`;

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
