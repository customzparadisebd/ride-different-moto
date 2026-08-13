
-- Use DO block to handle potential existing objects
DO $$
BEGIN
    -- Check if table exists, create if not
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hero_slides') THEN
        CREATE TABLE public.hero_slides (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            subtitle TEXT,
            image_url TEXT NOT NULL,
            mobile_image_url TEXT,
            link_url TEXT,
            link_label TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;
END $$;

-- Grant privileges (idempotent)
GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

-- Enable RLS (idempotent)
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they are correct
DROP POLICY IF EXISTS "Public can view active slides" ON public.hero_slides;
CREATE POLICY "Public can view active slides" ON public.hero_slides
    FOR SELECT TO anon
    USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can select slides" ON public.hero_slides;
CREATE POLICY "Authenticated users can select slides" ON public.hero_slides
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage slides" ON public.hero_slides;
CREATE POLICY "Admins can manage slides" ON public.hero_slides
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Insert initial data
-- We use a more robust check for existing data
INSERT INTO public.hero_slides (title, subtitle, image_url, mobile_image_url, link_url, sort_order, is_active)
SELECT 'We Are Perfect Price', 'Quality & Value', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/banner-perfect-price.png', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-mobile.png', 'all-products', 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title = 'We Are Perfect Price');

INSERT INTO public.hero_slides (title, subtitle, image_url, mobile_image_url, link_url, sort_order, is_active)
SELECT 'Pulsar N160', 'Modification Setup', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg', NULL, 'pulsar-n160', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title = 'Pulsar N160');

INSERT INTO public.hero_slides (title, subtitle, image_url, mobile_image_url, link_url, sort_order, is_active)
SELECT 'Yamaha R15 V4', 'Silver & Carbon Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-r15-v4.jpg', NULL, 'r15-v4', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title = 'Yamaha R15 V4');

INSERT INTO public.hero_slides (title, subtitle, image_url, mobile_image_url, link_url, sort_order, is_active)
SELECT 'Duke 250', 'Blacked Out Build', 'https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-duke-250.jpg', NULL, 'duke-250', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides WHERE title = 'Duke 250');
