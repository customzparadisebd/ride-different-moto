import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/data/site";

export const Route = createFileRoute("/api/public/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const robots = `User-agent: *
Allow: /
Disallow: /ad/
Disallow: /czp-ops-9f2c/
Disallow: /api/

Sitemap: ${site.url}/api/public/sitemap.xml`;

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
