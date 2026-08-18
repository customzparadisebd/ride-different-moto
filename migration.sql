-- Drop table if exists to be safe
DROP TABLE IF EXISTS public.section_settings;

CREATE TABLE public.section_settings (
    id text PRIMARY KEY,
    name text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    display_limit integer DEFAULT 8 NOT NULL,
    show_see_all boolean DEFAULT true NOT NULL,
    button_text text DEFAULT 'See All' NOT NULL,
    button_link text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_slider boolean DEFAULT false NOT NULL,
    slider_items integer DEFAULT 4,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Grant access
GRANT SELECT ON public.section_settings TO anon, authenticated;
GRANT ALL ON public.section_settings TO service_role;

-- Enable RLS
ALTER TABLE public.section_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read-only access"
ON public.section_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admins to manage section settings"
ON public.section_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Initial Seed
INSERT INTO public.section_settings (id, name, display_limit, button_text, button_link, sort_order)
VALUES 
('featured_deals', 'Featured & Deals', 6, 'Explore All Deals', '/shop?filter=featured', 1),
('all_products', 'All Products', 8, 'See All Products', '/shop', 2)
ON CONFLICT (id) DO NOTHING;
