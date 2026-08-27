DROP POLICY IF EXISTS "Admins can update invoice settings" ON public.invoice_settings;

CREATE POLICY "Admins can manage invoice settings"
ON public.invoice_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.invoice_settings TO authenticated;
GRANT ALL ON public.invoice_settings TO service_role;