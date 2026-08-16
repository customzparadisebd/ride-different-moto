import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getStorefrontBikeModels = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bike_models")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    
    return (data || []).map(model => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      label: model.label || "Modification Parts",
      image: model.image_url || "/placeholder-bike.jpg",
      alt: model.alt_text || model.name,
      order: model.sort_order,
      active: model.is_active
    }));
  });
