import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const restoreHeroSlides = async () => {
  const slides = [
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
      image_url: "https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg",
      link_url: "pulsar-n160",
      sort_order: 1,
      is_active: true
    },
    {
      title: "Yamaha R15 V4",
      subtitle: "Silver & Carbon Build",
      image_url: "https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-r15-v4.jpg",
      link_url: "r15-v4",
      sort_order: 2,
      is_active: true
    },
    {
      title: "Duke 250",
      subtitle: "Blacked Out Build",
      image_url: "https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-duke-250.jpg",
      link_url: "duke-250",
      sort_order: 3,
      is_active: true
    }
  ];

  for (const slide of slides) {
    const { data: existing } = await supabaseAdmin
      .from("hero_slides")
      .select("id")
      .eq("title", slide.title)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("hero_slides").update(slide).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("hero_slides").insert(slide);
    }
  }
  return { success: true };
};
