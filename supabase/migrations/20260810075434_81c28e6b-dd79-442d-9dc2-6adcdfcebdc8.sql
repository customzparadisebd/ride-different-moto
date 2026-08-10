-- Enums
DO $$ BEGIN
  CREATE TYPE public.movement_type AS ENUM ('stock_in','stock_out','adjustment','return','damage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BRANDS
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT SELECT ON public.brands TO anon;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active brands" ON public.brands FOR SELECT TO anon USING (is_active);
CREATE POLICY "Staff can read brands" ON public.brands FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Product staff can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE POLICY "Product staff can update brands" ON public.brands FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'products.manage')) WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE POLICY "Super admin can delete brands" ON public.brands FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE TRIGGER brands_touch_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active categories" ON public.categories FOR SELECT TO anon USING (is_active);
CREATE POLICY "Staff can read categories" ON public.categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Product staff can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE POLICY "Product staff can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'products.manage')) WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE POLICY "Super admin can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE TRIGGER categories_touch_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SUPPLIERS
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Product staff can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE POLICY "Product staff can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'products.manage')) WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE POLICY "Super admin can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE TRIGGER suppliers_touch_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  alt_phone text,
  email text,
  address text,
  area text,
  district text,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  is_favorite boolean NOT NULL DEFAULT false,
  is_blacklisted boolean NOT NULL DEFAULT false,
  is_fraud boolean NOT NULL DEFAULT false,
  total_orders integer NOT NULL DEFAULT 0,
  lifetime_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read customers" ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Customer staff can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'customers.manage'));
CREATE POLICY "Customer staff can update customers" ON public.customers FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'customers.manage')) WITH CHECK (public.has_permission(auth.uid(), 'customers.manage'));
CREATE TRIGGER customers_touch_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- INVENTORY MOVEMENTS (append-only)
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type public.movement_type NOT NULL,
  quantity integer NOT NULL,
  stock_after integer,
  reference text,
  notes text,
  performed_by uuid,
  performed_by_label text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_movements_product_idx ON public.inventory_movements(product_id, created_at DESC);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read stock movements" ON public.inventory_movements FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Product staff can add stock movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));

-- PAYMENTS (append-only)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'cod',
  reference text,
  notes text,
  received_by uuid,
  received_by_label text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments(order_id, created_at DESC);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read payments" ON public.payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Order staff can add payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'orders.manage'));

-- PRODUCT EXTRA FIELDS
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- BACKFILL CUSTOMERS FROM EXISTING ORDERS
INSERT INTO public.customers (name, phone, email, address, area, total_orders, lifetime_value, created_at)
SELECT DISTINCT ON (o.customer_phone)
  o.customer_name,
  o.customer_phone,
  MAX(o.customer_email) OVER (PARTITION BY o.customer_phone),
  o.address_line,
  o.city,
  COUNT(*) OVER (PARTITION BY o.customer_phone),
  SUM(o.total) OVER (PARTITION BY o.customer_phone),
  MIN(o.created_at) OVER (PARTITION BY o.customer_phone)
FROM public.orders o
WHERE o.deleted_at IS NULL AND o.customer_phone IS NOT NULL AND o.customer_phone <> ''
ORDER BY o.customer_phone, o.created_at DESC
ON CONFLICT (phone) DO NOTHING;