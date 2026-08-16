-- Correct misaligned product images
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=800&auto=format&fit=crop' WHERE slug = 'seat-cowl' AND image_url LIKE '%photo-1591637333184-19aa84b3e01f%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=800&auto=format&fit=crop' WHERE slug = 'visor' AND image_url LIKE '%photo-1568772585407-9361f9bf3a87%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1581232280308-2399eef4d29f?q=80&w=800&auto=format&fit=crop' WHERE slug = 'side-fairing' AND image_url LIKE '%photo-1558981403-c5f91cbba523%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=800&auto=format&fit=crop' WHERE slug = 'x-3-kit' AND image_url LIKE '%photo-1591637333184-19aa84b3e01f%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop' WHERE slug = 'ktm-rc-underbelly' AND image_url LIKE '%photo-1591637333184-19aa84b3e01f%';

-- Populate Bike Models
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.bike_models WHERE slug = 'bajaj-pulsar-n160-parts-bd') THEN
        INSERT INTO public.bike_models (name, slug, image_url, is_active, sort_order)
        VALUES ('Pulsar N160', 'bajaj-pulsar-n160-parts-bd', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg', true, 1);
    ELSE
        UPDATE public.bike_models SET image_url = 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg' 
        WHERE slug = 'bajaj-pulsar-n160-parts-bd' AND (image_url IS NULL OR image_url = '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.bike_models WHERE slug = 'pulsar-n250-parts-bangladesh') THEN
        INSERT INTO public.bike_models (name, slug, image_url, is_active, sort_order)
        VALUES ('Pulsar N250', 'pulsar-n250-parts-bangladesh', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg', true, 2);
    ELSE
        UPDATE public.bike_models SET image_url = 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg' 
        WHERE slug = 'pulsar-n250-parts-bangladesh' AND (image_url IS NULL OR image_url = '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.bike_models WHERE slug = 'yamaha-r15-v4-modification-parts') THEN
        INSERT INTO public.bike_models (name, slug, image_url, is_active, sort_order)
        VALUES ('Yamaha R15 V4', 'yamaha-r15-v4-modification-parts', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-r15-v4.jpg', true, 3);
    ELSE
        UPDATE public.bike_models SET image_url = 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-r15-v4.jpg' 
        WHERE slug = 'yamaha-r15-v4-modification-parts' AND (image_url IS NULL OR image_url = '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.bike_models WHERE slug = 'ktm-duke-250-accessories-bd') THEN
        INSERT INTO public.bike_models (name, slug, image_url, is_active, sort_order)
        VALUES ('Duke 250', 'ktm-duke-250-accessories-bd', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-duke-250.jpg', true, 4);
    ELSE
        UPDATE public.bike_models SET image_url = 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-duke-250.jpg' 
        WHERE slug = 'ktm-duke-250-accessories-bd' AND (image_url IS NULL OR image_url = '');
    END IF;
END $$;

-- Link Hero Slides to Bike Models
UPDATE public.hero_slides hs
SET bike_model_id = bm.id
FROM public.bike_models bm
WHERE hs.link_url = bm.slug
AND hs.bike_model_id IS NULL;

-- GRANT permissions
GRANT SELECT ON public.bike_models TO anon, authenticated;
GRANT ALL ON public.bike_models TO service_role;
