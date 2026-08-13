-- Migration: Add hero slides management (V3 - Hard Matching existing types.ts)
-- Description: Drop and recreate hero_slides with columns exactly as found in src/integrations/supabase/types.ts

DROP TABLE IF EXISTS public.hero_slides CASCADE;

CREATE TABLE public.hero_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    subtitle text,
    image_url text NOT NULL,
    link_url text,
    link_label text,
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
INSERT INTO public.hero_slides (title, subtitle, image_url, link_url, sort_order, is_active)
VALUES 
('We Are Perfect Price', 'Quality & Value', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/banner-perfect-price.png', '/', 0, true),
('Pulsar N160', 'Modification Setup', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-pulsar-n160.jpg', '/bike-models/pulsar-n160', 1, true),
('Yamaha R15 V4', 'Silver & Carbon Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-r15-v4.jpg', '/bike-models/r15-v4', 2, true),
('Duke 250', 'Blacked Out Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/assets/hero-duke-250.jpg', '/bike-models/duke-250', 3, true);
