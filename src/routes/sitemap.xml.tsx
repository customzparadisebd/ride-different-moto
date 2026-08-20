import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { getBaseUrl } from "@/lib/seo";

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const settings = await getSiteSettings({ data: undefined });
        const siteUrl = await getBaseUrl(settings);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        
        const [{ data: products }, { data: models }] = await Promise.all([
          supabaseAdmin
            .from("products")
            .select("slug, updated_at")
            .eq("is_active", true)
            .is("deleted_at", null),
          supabaseAdmin
            .from("bike_models")
            .select("slug, updated_at")
            .eq("is_active", true)
        ]);

        const lastMod = new Date().toISOString().split("T")[0];

        const urls = [
          { loc: siteUrl, priority: "1.0", lastmod: lastMod },
          { loc: `${siteUrl}/shop`, priority: "0.8", lastmod: lastMod },
          { loc: `${siteUrl}/bike-models`, priority: "0.7", lastmod: lastMod },
          ...["graphics", "lighting", "seat", "exhaust", "handlebar", "body-kit", "accessories", "other"].map(cat => ({
            loc: `${siteUrl}/shop?category=${cat}`,
            priority: "0.6",
            lastmod: lastMod,
          })),
          ...(products || []).map((p) => ({
            loc: `${siteUrl}/products/${p.slug}`,
            priority: "0.7",
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : lastMod,
          })),
          ...(models || []).map((m) => ({
            loc: `${siteUrl}/bike-models/${m.slug}`,
            priority: "0.7",
            lastmod: m.updated_at ? new Date(m.updated_at).toISOString().split("T")[0] : lastMod,
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
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
