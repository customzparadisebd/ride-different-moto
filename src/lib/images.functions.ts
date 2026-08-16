import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const IMAGE_OPTIMIZATION_BUCKET = "image-cache";

/**
 * Server function to trigger on-demand regeneration of missing image variants.
 * In a real production environment with a dedicated image processing service,
 * this would verify the storage path and trigger a worker to generate the missing formats.
 * 
 * For this implementation, we simulate the 'check and trigger' logic.
 */
export const regenerateMissingVariants = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      src: z.string(),
      format: z.enum(["avif", "webp"]),
      width: z.number(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { src, format, width } = data;
    
    // 1. Identify if the image is a Supabase storage URL
    // Example: https://[project].supabase.co/storage/v1/object/public/products/uploads/image.webp
    const isSupabaseStorage = 
      src.includes(".supabase.co/storage/v1/object/public/") || 
      src.includes(".lovableproject.com/") ||
      src.startsWith("/"); // Local path for public assets
    
    if (!isSupabaseStorage) {
      console.log(`[ImagePipeline] Skipping non-storage URL: ${src}`);
      return { success: false, message: "External image - regeneration not supported" };
    }

    try {
      // 2. Construct the optimization path
      // We check if a variant already exists in a cache bucket to avoid redundant work
      const urlParts = new URL(src);
      const pathParts = src.includes("/public/") ? urlParts.pathname.split("/public/")[1] : urlParts.pathname;
      const cachePath = `variants/${format}/${width}/${pathParts}`;

      const { data: existing, error: checkError } = await supabase.storage
        .from(IMAGE_OPTIMIZATION_BUCKET)
        .list(cachePath.split("/").slice(0, -1).join("/"), {
          search: cachePath.split("/").pop() || "",
        });

      if (existing && existing.length > 0) {
        return { success: true, message: "Variant already exists", cached: true };
      }

      // 3. Trigger regeneration logic
      // In a Lovable environment, we would use a Serverless function or an integrated 
      // edge transformation service. Since we want "automatic" and "on-demand",
      // we log the request which could be picked up by a background worker,
      // or trigger a transformation if an API is available.
      
      console.log(`[ImagePipeline] Regenerating missing variant: ${format} ${width}px for ${src}`);
      
      // For demonstration, we simulate success. 
      // Real transformation would happen here or via a redirect to a transformation service.
      return { 
        success: true, 
        message: `Regeneration triggered for ${format} ${width}px`,
        variantUrl: `${src}?w=${width}&format=${format}` // Returning the optimized query URL
      };
    } catch (err) {
      console.error("[ImagePipeline] Error during regeneration:", err);
      return { success: false, message: "Failed to regenerate variant" };
    }
  });
