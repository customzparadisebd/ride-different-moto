CREATE TABLE public.bike_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    label text,
    image_url text,
    alt_text text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bike_models TO authenticated;
GRANT ALL ON public.bike_models TO service_role;
GRANT SELECT ON public.bike_models TO anon;

ALTER TABLE public.bike_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read-only for active models" ON public.bike_models
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Admins can manage bike models" ON public.bike_models
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS bike_model_id uuid REFERENCES public.bike_models(id) ON DELETE SET NULL;

INSERT INTO public.bike_models (slug, name, label, sort_order, is_active) VALUES
('bajaj-pulsar-n160-parts-bd', 'Pulsar N160', 'Modification Parts', 1, true),
('pulsar-ns200-modification-bd', 'Pulsar NS200', 'Modification Parts', 2, true),
('pulsar-n250-parts-bangladesh', 'Pulsar N250', 'Modification Parts', 3, true),
('yamaha-r15-v4-modification-parts', 'Yamaha R15 V4', 'Modification Parts', 4, true),
('yamaha-mt-15-accessories-bd', 'MT-15', 'Modification Parts', 5, true),
('ktm-duke-250-accessories-bd', 'Duke 250', 'Modification Parts', 6, true),
('yamaha-r15-v3-parts-bd', 'Yamaha R15 V3', 'Modification Parts', 7, true),
('yamaha-r15-modification-bd', 'Yamaha R15', 'Modification Parts', 8, false),
('kawasaki-ninja-6r-accessories-bd', 'Ninja 6R', 'Modification Parts', 9, false),
('tvs-apache-rtr-parts-bd', 'Apache RTR', 'Modification Parts', 10, false),
('tvs-apache-4v-modification-bd', 'Apache 4V', 'Modification Parts', 11, false),
('suzuki-gixxer-monotone-parts-bd', 'Gixxer Monotone', 'Modification Parts', 12, false),
('suzuki-gixxer-fi-abs-modification-bd', 'Gixxer FI ABS', 'Modification Parts', 13, false),
('suzuki-gixxer-sf-parts-bd', 'Gixxer SF', 'Modification Parts', 14, false)
ON CONFLICT (slug) DO NOTHING;
