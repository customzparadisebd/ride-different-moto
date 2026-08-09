-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'staff')
  );
$$;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- invoice numbering
CREATE SEQUENCE public.invoice_seq START 1;
GRANT USAGE ON SEQUENCE public.invoice_seq TO service_role;

CREATE OR REPLACE FUNCTION public.next_invoice_no()
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'CZP-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0');
$$;

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE DEFAULT public.next_invoice_no(),
  idempotency_key text UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address_line text NOT NULL,
  city text NOT NULL,
  notes text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  shipping numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  payment_status text NOT NULL DEFAULT 'unpaid',
  order_source text NOT NULL DEFAULT 'website',
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX orders_status_idx ON public.orders (status);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text,
  product_slug text,
  product_name text NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  actor uuid,
  actor_label text NOT NULL DEFAULT 'system',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_id_idx ON public.order_events (order_id, created_at DESC);
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view order events" ON public.order_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create order events" ON public.order_events
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_touch_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();