import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function restoreHeroSlides() {
  console.log("Starting hero slides restoration...");

  const slides = [
    {
      title: "Perfect Price",
      subtitle: "MODIFICATION IS EXPENSIVE BUT HAND IN OUR HEART",
      image_url: "/hero/hero-desktop.png",
      mobile_image_url: "/hero/hero-mobile.png",
      link_url: "all-products",
      sort_order: 0,
      is_active: true
    },
    {
      title: "Pulsar N160",
      subtitle: "Modification Setup",
      image_url: "/src/assets/hero-pulsar-n160.jpg",
      link_url: "pulsar-n160",
      sort_order: 1,
      is_active: true
    },
    {
      title: "Yamaha R15 V4",
      subtitle: "Silver & Carbon Build",
      image_url: "/src/assets/hero-r15-v4.jpg",
      link_url: "r15-v4",
      sort_order: 2,
      is_active: true
    },
    {
      title: "Duke 250",
      subtitle: "Blacked Out Build",
      image_url: "/src/assets/hero-duke-250.jpg",
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
      .single();

    if (existing) {
      console.log(`Updating slide: ${slide.title}`);
      await supabaseAdmin.from("hero_slides").update(slide).eq("id", existing.id);
    } else {
      console.log(`Inserting slide: ${slide.title}`);
      await supabaseAdmin.from("hero_slides").insert(slide);
    }
  }

  console.log("Restoration complete.");
}

restoreHeroSlides().catch(console.error);
