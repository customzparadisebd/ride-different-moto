-- Migration: Add hero slides management
-- Description: Create hero_slides table and policies

CREATE TABLE public.hero_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_name text NOT NULL,
    label text,
    image text NOT NULL,
    mobile_image text,
    alt text NOT NULL,
    bike_slug text NOT NULL DEFAULT 'all-products',
    cta_text text,
    cta_link text,
    is_full_banner boolean NOT NULL DEFAULT false,
    "order" integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hero slides are viewable by everyone" 
ON public.hero_slides FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage hero slides" 
ON public.hero_slides FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed initial slides from catalog.ts
INSERT INTO public.hero_slides (bike_name, label, image, mobile_image, alt, bike_slug, "order", active, is_full_banner)
VALUES 
('We Are Perfect Price', 'Quality & Value', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/banner-perfect-price.png', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-mobile.png', 'Modification is expensive but hand in our heart - We are perfect price banner', 'all-products', 0, true, true),
('Pulsar N160', 'Modification Setup', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-pulsar-n160.jpg', NULL, 'Modified Bajaj Pulsar N160 with red and black custom bodywork', 'pulsar-n160', 1, true, false),
('Yamaha R15 V4', 'Silver & Carbon Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-r15-v4.jpg', NULL, 'Modified Yamaha R15 V4 with silver and red fairing graphics', 'r15-v4', 2, true, false),
('Duke 250', 'Blacked Out Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-duke-250.jpg', NULL, 'Blacked out KTM Duke 250 with red frame and aftermarket exhaust', 'duke-250', 3, true, false);
