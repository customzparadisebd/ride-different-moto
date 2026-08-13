ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

-- Policies for hero-banners bucket
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hero-banners');
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero-banners' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admin Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hero-banners' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
