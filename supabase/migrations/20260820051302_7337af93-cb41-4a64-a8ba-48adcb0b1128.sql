CREATE TABLE public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.flash_sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash_sales TO authenticated;
GRANT ALL ON public.flash_sales TO service_role;

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view flash sales" ON public.flash_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can insert flash sales" ON public.flash_sales FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update flash sales" ON public.flash_sales FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete flash sales" ON public.flash_sales FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER flash_sales_touch_updated_at BEFORE UPDATE ON public.flash_sales FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.flash_sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id uuid NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flash_sale_id, product_id)
);

GRANT SELECT ON public.flash_sale_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash_sale_products TO authenticated;
GRANT ALL ON public.flash_sale_products TO service_role;

ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view flash sale products" ON public.flash_sale_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can insert flash sale products" ON public.flash_sale_products FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update flash sale products" ON public.flash_sale_products FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete flash sale products" ON public.flash_sale_products FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE INDEX idx_flash_sale_products_product ON public.flash_sale_products(product_id);
