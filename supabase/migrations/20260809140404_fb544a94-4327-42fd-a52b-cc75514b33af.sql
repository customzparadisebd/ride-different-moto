CREATE TABLE public.store_settings (
  id text NOT NULL PRIMARY KEY DEFAULT 'default',
  shipping_flat numeric NOT NULL DEFAULT 120,
  zone_charges jsonb NOT NULL DEFAULT '{"inside_dhaka":120,"dhaka_suburb":150,"outside_dhaka":180}'::jsonb,
  payment_methods jsonb NOT NULL DEFAULT '["cash_on_delivery","bkash","nagad","bank_transfer"]'::jsonb,
  support_phone text NOT NULL DEFAULT '+8801890722202',
  support_email text,
  low_stock_threshold integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_single_row CHECK (id = 'default')
);

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings are publicly readable"
  ON public.store_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Staff with product permission can update store settings"
  ON public.store_settings FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'products.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));

CREATE TRIGGER store_settings_touch_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.store_settings (id) VALUES ('default');