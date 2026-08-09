-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text NOT NULL,
  slug text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'accessories',
  bike_compatibility text[] NOT NULL DEFAULT '{}',
  is_universal boolean NOT NULL DEFAULT false,
  description text,
  price numeric NOT NULL DEFAULT 0,
  offer_price numeric,
  stock_qty integer NOT NULL DEFAULT 0,
  is_best_deal boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX products_sku_key ON public.products (lower(sku)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX products_slug_key ON public.products (lower(slug)) WHERE deleted_at IS NULL;
CREATE INDEX products_active_idx ON public.products (is_active, deleted_at);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT TO anon
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Staff can view all products"
  ON public.products FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Product managers can create products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));

CREATE POLICY "Product managers can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'products.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));

CREATE POLICY "Super admins can permanently delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- ORDER WORKFLOW ADDITIONS
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN assigned_to uuid,
  ADD COLUMN is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN pinned_by uuid,
  ADD COLUMN pinned_at timestamptz,
  ADD COLUMN printed_at timestamptz,
  ADD COLUMN printed_by uuid,
  ADD COLUMN print_count integer NOT NULL DEFAULT 0,
  ADD COLUMN is_duplicate boolean NOT NULL DEFAULT false,
  ADD COLUMN duplicate_note text,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid,
  ADD COLUMN delete_reason text,
  ADD COLUMN consignment_id text,
  ADD COLUMN tracking_url text,
  ADD COLUMN shipment_at timestamptz,
  ADD COLUMN courier_response jsonb;

CREATE INDEX orders_phone_idx ON public.orders (customer_phone);
CREATE INDEX orders_assigned_idx ON public.orders (assigned_to);
CREATE INDEX orders_active_idx ON public.orders (deleted_at, created_at DESC);

-- ============================================================
-- COURIER SHIPMENTS (one row per shipment attempt)
-- ============================================================
CREATE TABLE public.courier_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_name text NOT NULL DEFAULT 'steadfast',
  consignment_id text,
  tracking_code text,
  tracking_url text,
  courier_status text NOT NULL DEFAULT 'pending',
  success boolean NOT NULL DEFAULT false,
  response_status text,
  response_message text,
  sent_by uuid,
  sent_by_label text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX courier_shipments_order_idx ON public.courier_shipments (order_id, created_at DESC);

GRANT SELECT, INSERT ON public.courier_shipments TO authenticated;
GRANT ALL ON public.courier_shipments TO service_role;

ALTER TABLE public.courier_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view courier shipments"
  ON public.courier_shipments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create courier shipments"
  ON public.courier_shipments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- ============================================================
-- STORE SETTINGS: courier integration toggle
-- ============================================================
ALTER TABLE public.store_settings
  ADD COLUMN steadfast_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN steadfast_base_url text NOT NULL DEFAULT 'https://portal.packzy.com/api/v1';