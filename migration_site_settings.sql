CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  production_domain TEXT DEFAULT 'customparadisebd.com',
  business_name TEXT DEFAULT 'Customz Paradise BD',
  business_description TEXT,
  tagline TEXT,
  address TEXT,
  city TEXT DEFAULT 'Dhaka',
  country TEXT DEFAULT 'Bangladesh',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  business_hours JSONB DEFAULT '{}'::jsonb,
  main_branch_info TEXT,
  branch_relationship TEXT,
  default_meta_title TEXT,
  default_meta_description TEXT,
  organization_schema JSONB DEFAULT '{}'::jsonb,
  local_business_schema JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon USING (TRUE);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.site_settings (
  id, business_name, tagline, business_description, phone, whatsapp, email, address
) VALUES (
  'default',
  'Customz Paradise BD',
  'Ride Different. Be Different.',
  'Premium motorcycle modification parts and accessories in Bangladesh. Unique designs, quality-focused products and nationwide delivery.',
  '+880 1890-722202',
  '8801890722202',
  'customzparadisebd@gmail.com',
  'Uttara-1230, Dhaka, Bangladesh'
) ON CONFLICT (id) DO NOTHING;
