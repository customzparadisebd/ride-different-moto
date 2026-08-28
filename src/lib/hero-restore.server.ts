import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type HeroSlideRow = Database["public"]["Tables"]["hero_slides"]["Row"];
type HeroSlideInsert = Database["public"]["Tables"]["hero_slides"]["Insert"];

/**
 * Portability: build storage URLs from the configured Supabase project instead of
 * hardcoding a project ref, so the seed works on any Supabase instance.
 */
const heroBanner = (file: string) => {
  const base = (process.env["SUPABASE_URL"] ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/hero-banners/${file}`;
};

export const restoreHeroSlides = async () => {
  const slides: HeroSlideInsert[] = [
    {
      title: "Perfect Price",
      subtitle: "MODIFICATION IS EXPENSIVE BUT HAND IN OUR HEART",
      image_url: "/__l5e/assets-v1/c187090e-7ba9-4046-9981-57540145e782/hero-desktop.webp",
      mobile_image_url: "/__l5e/assets-v1/c8d9b474-5ea7-4248-b900-7aa7017003ee/hero-mobile.webp",
      link_url: "all-products",
      sort_order: 0,
      is_active: true
    },
    {
      title: "Pulsar N160",
      subtitle: "Modification Setup",
      image_url: heroBanner("hero-pulsar-n160.jpg"),
      link_url: "bajaj-pulsar-n160-parts-bd",
      sort_order: 1,
      is_active: true
    },
    {
      title: "Pulsar N250",
      subtitle: "Full Modification Guide",
      image_url: heroBanner("hero-pulsar-n160.jpg"),
      link_url: "pulsar-n250-parts-bangladesh",
      sort_order: 2,
      is_active: true
    },
    {
      title: "Yamaha R15 V4",
      subtitle: "Silver & Carbon Build",
      image_url: heroBanner("hero-r15-v4.jpg"),
      link_url: "yamaha-r15-v4-modification-parts",
      sort_order: 3,
      is_active: true
    },
    {
      title: "Duke 250",
      subtitle: "Blacked Out Build",
      image_url: heroBanner("hero-duke-250.jpg"),
      link_url: "ktm-duke-250-accessories-bd",
      sort_order: 4,
      is_active: true
    }
  ];

  // Fetch all bike models to link slides correctly
  const { data: bikeModels } = await supabaseAdmin
    .from("bike_models")
    .select("id, slug");

  for (const slide of slides) {
    const bikeModel = bikeModels?.find(m => m.slug === slide.link_url);
    const slideWithModel: HeroSlideInsert = {
      ...slide,
      bike_model_id: bikeModel?.id ?? null
    };

    const { data: existing } = await supabaseAdmin
      .from("hero_slides")
      .select("id")
      .eq("title", slide.title)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("hero_slides").update(slideWithModel).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("hero_slides").insert(slideWithModel);
    }
  }
  return { success: true };
};
