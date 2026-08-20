-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for logos bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- Create site_logos table
CREATE TABLE public.site_logos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    url TEXT,
    storage_path TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Grant access
GRANT SELECT ON public.site_logos TO anon, authenticated;
GRANT ALL ON public.site_logos TO authenticated;
GRANT ALL ON public.site_logos TO service_role;

-- Enable RLS
ALTER TABLE public.site_logos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Site Logos" ON public.site_logos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin Manage Site Logos" ON public.site_logos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Initial seeding
INSERT INTO public.site_logos (category, label, description, settings) VALUES
('main', 'Main Brand Logo', 'Primary brand logo used across the site.', '{"recommended_width": 512, "recommended_height": 512, "aspect_ratio": "1:1", "transparency_required": true}'),
('header', 'Header Logo', 'Logo displayed in the main navigation bar.', '{"recommended_height": 80, "transparency_required": true}'),
('footer', 'Footer Logo', 'Logo displayed in the website footer.', '{"recommended_height": 80, "transparency_required": true}'),
('mobile', 'Mobile Navigation Logo', 'Logo for the mobile side menu.', '{"recommended_height": 60, "transparency_required": true}'),
('admin_login', 'Admin Login Logo', '3D or large logo for the admin login screen.', '{"recommended_width": 800, "recommended_height": 800, "aspect_ratio": "1:1", "transparency_required": true}'),
('admin_sidebar', 'Admin Sidebar Logo', 'Small logo for the admin panel sidebar.', '{"recommended_height": 48, "transparency_required": true}'),
('invoice', 'Invoice Logo', 'Logo specifically optimized for PDF/Print invoices.', '{"recommended_height": 120, "recommended_size_kb": 200}'),
('favicon', 'Site Favicon', 'The small icon in the browser tab.', '{"recommended_width": 32, "recommended_height": 32, "aspect_ratio": "1:1"}'),
('og_image', 'Social Sharing (OG) Image', 'Image shown when sharing the site on social media.', '{"recommended_width": 1200, "recommended_height": 630, "aspect_ratio": "1.91:1", "recommended_size_kb": 500}');

