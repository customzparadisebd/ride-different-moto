-- Public read for storefront image buckets
CREATE POLICY "Public read products bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'products');
CREATE POLICY "Public read bike-models bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bike-models');
CREATE POLICY "Public read hero bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hero');

-- Staff-only writes
CREATE POLICY "Staff upload products bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update products bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products' AND public.is_staff(auth.uid())) WITH CHECK (bucket_id = 'products' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete products bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff upload bike-models bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bike-models' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update bike-models bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bike-models' AND public.is_staff(auth.uid())) WITH CHECK (bucket_id = 'bike-models' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete bike-models bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bike-models' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff upload hero bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update hero bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hero' AND public.is_staff(auth.uid())) WITH CHECK (bucket_id = 'hero' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete hero bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hero' AND public.is_staff(auth.uid()));