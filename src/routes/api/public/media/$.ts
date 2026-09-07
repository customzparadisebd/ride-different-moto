import { createFileRoute } from "@tanstack/react-router";
import { isPublicMediaBucket } from "@/lib/storage-url";

/**
 * Serves media stored in Supabase Storage through a same-origin path.
 * Read-only, allow-listed buckets only — no user data buckets (e.g. avatars).
 * This keeps uploaded image URLs portable across hosting environments and
 * works even when buckets are private.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as Record<string, string>)["_splat"] ?? "";
        const [bucket, ...rest] = splat.split("/");
        const objectPath = rest.join("/");

        if (!bucket || !objectPath || objectPath.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        if (!isPublicMediaBucket(bucket)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(objectPath);

        if (error || !data) {
          console.error(`[media] ${bucket}/${objectPath}: ${error?.message ?? "missing object"}`);
          return new Response("Not found", { status: 404 });
        }

        return new Response(await data.arrayBuffer(), {
          status: 200,
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
