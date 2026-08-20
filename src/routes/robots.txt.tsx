import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { getBaseUrl } from "@/lib/seo";

export const Route = createFileRoute("/robots/txt")({
  server: {
    handlers: {
      GET: async () => {
        const settings = await getSiteSettings({ data: undefined });
        const siteUrl = await getBaseUrl(settings);

        const robots = `User-agent: *
Allow: /
Disallow: /ad/
Disallow: /czp-ops-9f2c/
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml`;

        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
