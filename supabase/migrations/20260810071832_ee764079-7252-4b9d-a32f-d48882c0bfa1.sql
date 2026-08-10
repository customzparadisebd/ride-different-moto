-- ============================================================
-- MULTI-COURIER + CONFIGURABLE WEBSITE CONTENT FOUNDATION
-- Status: COMPLETED
-- Purpose: Adds courier providers/credentials/logs/tracking,
--          product colour variations & badges, delivery zones and
--          editable website content (reviews, nav, social, hero).
-- Security: Courier credentials live in their own table with RLS on
--          and NO policies/grants, so only server-side service code
--          can ever read them. Everything else is permission-gated.
-- ============================================================

-- ---------- new permissions are plain strings; no schema change ----------

-- ---------- COURIERS ----------
CREATE TABLE public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  phone text,
  base_url text NOT NULL DEFAULT '',
  inside_charge numeric NOT NULL DEFAULT 0,
  outside_charge numeric NOT NULL DEFAULT 0,
  cod_percent numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.couriers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.couriers TO authenticated;
GRANT ALL ON public.couriers TO service_role;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view couriers" ON public.couriers
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Courier managers can create couriers" ON public.couriers
  FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'couriers.manage'));
CREATE POLICY "Courier managers can update couriers" ON public.couriers
  FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'couriers.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'couriers.manage'));
CREATE POLICY "Super admins can delete couriers" ON public.couriers
  FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE TRIGGER couriers_touch_updated_at BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- COURIER CREDENTIALS (server-only, no policies on purpose) ----------
CREATE TABLE public.courier_credentials (
  courier_id uuid PRIMARY KEY REFERENCES public.couriers(id) ON DELETE CASCADE,
  api_key text,
  api_secret text,
  username text,
  password text,
  token text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.courier_credentials TO service_role;
ALTER TABLE public.courier_credentials ENABLE ROW LEVEL SECURITY;

-- ---------- COURIER API LOG ----------
CREATE TABLE public.courier_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid REFERENCES public.couriers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  action text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  status_code text,
  message text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courier_api_logs TO authenticated;
GRANT ALL ON public.courier_api_logs TO service_role;
ALTER TABLE public.courier_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view courier logs" ON public.courier_api_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- SHIPMENTS: link to courier + money + timings ----------
ALTER TABLE public.courier_shipments
  ADD COLUMN IF NOT EXISTS courier_id uuid REFERENCES public.couriers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cod_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charge numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_status_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS courier_shipments_order_active_idx
  ON public.courier_shipments(order_id) WHERE is_active AND success;

-- ---------- TRACKING EVENTS ----------
CREATE TABLE public.courier_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.courier_shipments(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_status text NOT NULL,
  message text,
  source text NOT NULL DEFAULT 'sync',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courier_tracking_events TO authenticated;
GRANT ALL ON public.courier_tracking_events TO service_role;
ALTER TABLE public.courier_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view tracking events" ON public.courier_tracking_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- ORDERS: courier reference + COD amount ----------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_id uuid REFERENCES public.couriers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cod_amount numeric NOT NULL DEFAULT 0;

-- ---------- PRODUCTS: gallery, details, badge, discount ----------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS badge_type text,
  ADD COLUMN IF NOT EXISTS badge_text text,
  ADD COLUMN IF NOT EXISTS badge_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_enabled boolean NOT NULL DEFAULT false;

-- ---------- PRODUCT COLOURS ----------
CREATE TABLE public.product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  swatch text NOT NULL DEFAULT '#000000',
  price_delta numeric NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_colors_product_idx ON public.product_colors(product_id);
GRANT SELECT ON public.product_colors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_colors TO authenticated;
GRANT ALL ON public.product_colors TO service_role;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active colours" ON public.product_colors
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff can view colours" ON public.product_colors
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Product managers can write colours" ON public.product_colors
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'products.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));
CREATE TRIGGER product_colors_touch_updated_at BEFORE UPDATE ON public.product_colors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- DELIVERY ZONES ----------
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  charge numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delivery_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_zones TO authenticated;
GRANT ALL ON public.delivery_zones TO service_role;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active zones" ON public.delivery_zones
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff can view zones" ON public.delivery_zones
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Zone managers can write zones" ON public.delivery_zones
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'zones.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'zones.manage'));
CREATE TRIGGER delivery_zones_touch_updated_at BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- CUSTOMER REVIEWS ----------
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_location text,
  rating integer NOT NULL DEFAULT 5,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active reviews" ON public.reviews
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Content managers can write reviews" ON public.reviews
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'content.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'content.manage'));
CREATE TRIGGER reviews_touch_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- NAVIGATION ITEMS ----------
CREATE TABLE public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  path text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active nav" ON public.nav_items
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff can view nav" ON public.nav_items
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Content managers can write nav" ON public.nav_items
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'content.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'content.manage'));
CREATE TRIGGER nav_items_touch_updated_at BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- SOCIAL LINKS ----------
CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active social links" ON public.social_links
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff can view social links" ON public.social_links
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Content managers can write social links" ON public.social_links
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'content.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'content.manage'));
CREATE TRIGGER social_links_touch_updated_at BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- HERO SLIDES ----------
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  link_label text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active slides" ON public.hero_slides
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff can view slides" ON public.hero_slides
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Content managers can write slides" ON public.hero_slides
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'content.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'content.manage'));
CREATE TRIGGER hero_slides_touch_updated_at BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- SEED CONTENT ----------
INSERT INTO public.couriers (slug, name, base_url, inside_charge, outside_charge, cod_percent, is_active, sort_order)
VALUES
  ('steadfast', 'SteadFast', 'https://portal.packzy.com/api/v1', 60, 120, 0.5, false, 1),
  ('pathao', 'Pathao', 'https://api-hermes.pathao.com', 60, 120, 1.0, false, 2),
  ('redx', 'RedX', 'https://openapi.redx.com.bd/v1.0.0-beta', 60, 120, 0.5, false, 3);

INSERT INTO public.delivery_zones (slug, name, charge, sort_order) VALUES
  ('inside_dhaka', 'Inside Dhaka', 120, 1),
  ('dhaka_suburb', 'Dhaka Suburb', 150, 2),
  ('outside_dhaka', 'Outside Dhaka', 180, 3);

INSERT INTO public.nav_items (label, path, sort_order) VALUES
  ('Home', '/', 1),
  ('All Products', '/shop', 2),
  ('Bike Models', '/bike-models', 3),
  ('Customer Reviews', '/reviews', 4),
  ('About Us', '/about', 5),
  ('Contact Us', '/contact', 6);

INSERT INTO public.social_links (platform, label, url, sort_order) VALUES
  ('facebook', 'Facebook', 'https://facebook.com/customzparadisebd', 1),
  ('instagram', 'Instagram', 'https://instagram.com/customzparadisebd', 2),
  ('youtube', 'YouTube', 'https://youtube.com/@customzparadisebd', 3),
  ('whatsapp', 'WhatsApp', 'https://wa.me/8801890722202', 4);

INSERT INTO public.reviews (author_name, author_location, rating, body, sort_order) VALUES
  ('Tanvir Ahmed', 'Dhaka', 5, 'Fitted a full LED setup on my FZ-S. Finish quality is unreal and the team knew exactly what they were doing.', 1),
  ('Rakib Hasan', 'Chattogram', 5, 'Ordered a crash guard, delivered in two days with COD. Perfect fit, no rattles.', 2),
  ('Mehedi Islam', 'Gazipur', 5, 'Custom paint on my R15 looks better than showroom. Worth every taka.', 3);