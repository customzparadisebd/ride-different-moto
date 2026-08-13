-- Migration: Add hero slides management (V2 - Matching existing table if any, or hardening)
-- Description: Drop and recreate hero_slides with expected columns to ensure compatibility with our features

DROP TABLE IF EXISTS public.hero_slides CASCADE;

CREATE TABLE public.hero_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    subtitle text,
    image_url text NOT NULL,
    mobile_image_url text,
    alt_text text NOT NULL,
    link_url text NOT NULL DEFAULT '/',
    link_label text,
    is_full_banner boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hero slides are viewable by everyone" 
ON public.hero_slides FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage hero slides" 
ON public.hero_slides FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed initial slides
INSERT INTO public.hero_slides (title, subtitle, image_url, mobile_image_url, alt_text, link_url, sort_order, is_active, is_full_banner)
VALUES 
('We Are Perfect Price', 'Quality & Value', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/banner-perfect-price.png', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-mobile.png', 'Modification is expensive but hand in our heart - We are perfect price banner', '/', 0, true, true),
('Pulsar N160', 'Modification Setup', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-pulsar-n160.jpg', NULL, 'Modified Bajaj Pulsar N160 with red and black custom bodywork', '/bike-models/pulsar-n160', 1, true, false),
('Yamaha R15 V4', 'Silver & Carbon Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-r15-v4.jpg', NULL, 'Modified Yamaha R15 V4 with silver and red fairing graphics', '/bike-models/r15-v4', 2, true, false),
('Duke 250', 'Blacked Out Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-duke-250.jpg', NULL, 'Blacked out KTM Duke 250 with red frame and aftermarket exhaust', '/bike-models/duke-250', 3, true, false);
