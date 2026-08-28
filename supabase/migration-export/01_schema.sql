-- =====================================================================
--  CUSTOMZ PARADISE BD - portable schema export (public schema)
--  Generated from the live database. Run this FIRST on the new project,
--  in the Supabase SQL editor, as a single script.
--  Order: enums -> sequences -> tables -> functions -> constraints ->
--         indexes -> triggers -> grants -> RLS -> policies
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET search_path = public;

-- ---------------- ENUM TYPES ----------------

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.movement_type AS ENUM ('stock_in', 'stock_out', 'adjustment', 'return', 'damage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------- SEQUENCES ----------------

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE SEQUENCE IF NOT EXISTS public.invoice_seq;

-- ---------------- TABLES ----------------

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  ip_address text,
  user_agent text,
  session_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
  revoked_at timestamp with time zone,
  revoked_by uuid
);

CREATE TABLE IF NOT EXISTS public.ai_settings (
  id text DEFAULT 'default'::text NOT NULL,
  enabled boolean DEFAULT false NOT NULL,
  provider text DEFAULT 'gemini'::text NOT NULL,
  model_name text,
  api_key text,
  credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.bike_models (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  label text,
  image_url text,
  alt_text text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courier_api_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  courier_id uuid,
  order_id uuid,
  action text NOT NULL,
  success boolean DEFAULT false NOT NULL,
  status_code text,
  message text,
  actor_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courier_credentials (
  courier_id uuid NOT NULL,
  api_key text,
  api_secret text,
  username text,
  password text,
  token text,
  extra jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courier_shipments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  courier_name text DEFAULT 'steadfast'::text NOT NULL,
  consignment_id text,
  tracking_code text,
  tracking_url text,
  courier_status text DEFAULT 'pending'::text NOT NULL,
  success boolean DEFAULT false NOT NULL,
  response_status text,
  response_message text,
  sent_by uuid,
  sent_by_label text DEFAULT 'system'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  courier_id uuid,
  cod_amount numeric DEFAULT 0 NOT NULL,
  delivery_charge numeric DEFAULT 0 NOT NULL,
  booked_at timestamp with time zone,
  last_status_at timestamp with time zone,
  is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courier_tracking_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  shipment_id uuid NOT NULL,
  order_id uuid,
  courier_status text NOT NULL,
  message text,
  source text DEFAULT 'sync'::text NOT NULL,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.couriers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  logo_url text,
  phone text,
  base_url text DEFAULT ''::text NOT NULL,
  inside_charge numeric DEFAULT 0 NOT NULL,
  outside_charge numeric DEFAULT 0 NOT NULL,
  cod_percent numeric DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  extra_config jsonb DEFAULT '{}'::jsonb NOT NULL,
  deleted_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_fraud_marks (
  phone_number text NOT NULL,
  mark_type text DEFAULT 'fraud'::text NOT NULL,
  label text,
  note text NOT NULL,
  marked_at timestamp with time zone DEFAULT now() NOT NULL,
  marked_by uuid,
  marked_by_label text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  alt_phone text,
  email text,
  address text,
  area text,
  district text,
  notes text,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  is_favorite boolean DEFAULT false NOT NULL,
  is_blacklisted boolean DEFAULT false NOT NULL,
  is_fraud boolean DEFAULT false NOT NULL,
  total_orders integer DEFAULT 0 NOT NULL,
  lifetime_value numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  delete_reason text
);

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  charge numeric DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.flash_sale_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  flash_sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.flash_sales (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  start_time time without time zone,
  end_time time without time zone,
  discount_type text DEFAULT 'percentage'::text NOT NULL,
  discount_value numeric DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  priority integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  link_label text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  mobile_image_url text,
  bike_model_id uuid
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_id uuid NOT NULL,
  type movement_type NOT NULL,
  quantity integer NOT NULL,
  stock_after integer,
  reference text,
  notes text,
  performed_by uuid,
  performed_by_label text DEFAULT 'system'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoice_collisions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  invoice_no text NOT NULL,
  existing_order_id uuid,
  attempted_order_payload jsonb,
  detected_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id text DEFAULT 'default'::text NOT NULL,
  prefix text DEFAULT 'CZP'::text NOT NULL,
  start_number integer DEFAULT 1 NOT NULL,
  current_number integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text,
  source text DEFAULT 'contact_form'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  status lead_status DEFAULT 'new'::lead_status NOT NULL,
  internal_notes text,
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  deleted_by uuid
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email_key text NOT NULL,
  ip_address text,
  success boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.mfa_backup_codes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.nav_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  label text NOT NULL,
  path text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.not_found_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  path text NOT NULL,
  referrer text,
  user_id uuid,
  user_agent text,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_damages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  reason text,
  processed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  event_type text NOT NULL,
  message text,
  actor uuid,
  actor_label text DEFAULT 'system'::text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id text,
  product_slug text,
  product_name text NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  line_total numeric(12,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  variant text,
  image_url text
);

CREATE TABLE IF NOT EXISTS public.order_returns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  reason text,
  processed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_stock_deductions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  deducted_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  invoice_no text NOT NULL,
  idempotency_key text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address_line text NOT NULL,
  city text NOT NULL,
  notes text,
  subtotal numeric(12,2) DEFAULT 0 NOT NULL,
  discount numeric(12,2) DEFAULT 0 NOT NULL,
  shipping numeric(12,2) DEFAULT 0 NOT NULL,
  total numeric(12,2) DEFAULT 0 NOT NULL,
  currency text DEFAULT 'BDT'::text NOT NULL,
  payment_method text DEFAULT 'cash_on_delivery'::text NOT NULL,
  payment_status text DEFAULT 'unpaid'::text NOT NULL,
  order_source text DEFAULT 'website'::text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  delivery_zone text,
  advance_paid numeric DEFAULT 0 NOT NULL,
  transaction_id text,
  courier_name text,
  courier_tracking_id text,
  courier_status text DEFAULT 'not_booked'::text NOT NULL,
  internal_notes text,
  assigned_to uuid,
  is_pinned boolean DEFAULT false NOT NULL,
  pinned_by uuid,
  pinned_at timestamp with time zone,
  printed_at timestamp with time zone,
  printed_by uuid,
  print_count integer DEFAULT 0 NOT NULL,
  is_duplicate boolean DEFAULT false NOT NULL,
  duplicate_note text,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  delete_reason text,
  consignment_id text,
  tracking_url text,
  shipment_at timestamp with time zone,
  courier_response jsonb,
  courier_id uuid,
  cod_amount numeric DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid,
  amount numeric NOT NULL,
  method text DEFAULT 'cod'::text NOT NULL,
  reference text,
  notes text,
  received_by uuid,
  received_by_label text DEFAULT 'system'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_360_images (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_colors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_id uuid NOT NULL,
  name text NOT NULL,
  swatch text DEFAULT '#000000'::text NOT NULL,
  price_delta numeric DEFAULT 0 NOT NULL,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  sku text NOT NULL,
  slug text NOT NULL,
  image_url text,
  category text DEFAULT 'accessories'::text NOT NULL,
  bike_compatibility text[] DEFAULT '{}'::text[] NOT NULL,
  is_universal boolean DEFAULT false NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  offer_price numeric,
  stock_qty integer DEFAULT 0 NOT NULL,
  is_best_deal boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  is_new_arrival boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  delete_reason text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  images jsonb DEFAULT '[]'::jsonb NOT NULL,
  details text,
  badge_type text,
  badge_text text,
  badge_enabled boolean DEFAULT false NOT NULL,
  discount_percent numeric DEFAULT 0 NOT NULL,
  offer_enabled boolean DEFAULT false NOT NULL,
  brand_id uuid,
  category_id uuid,
  supplier_id uuid,
  cost_price numeric DEFAULT 0 NOT NULL,
  barcode text,
  low_stock_threshold integer DEFAULT 3 NOT NULL,
  weight numeric,
  dimensions text,
  internal_notes text,
  sort_order integer DEFAULT 999,
  has_360_view boolean DEFAULT false,
  video_enabled boolean DEFAULT false,
  video_platform text,
  video_url text,
  out_of_stock_toggle boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  access_status text DEFAULT 'pending'::text NOT NULL,
  access_note text,
  approved_by uuid,
  approved_at timestamp with time zone,
  mfa_required boolean DEFAULT false NOT NULL,
  last_login_at timestamp with time zone,
  gender text,
  avatar_url text,
  phone_number text,
  last_login_ip text
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  author_name text NOT NULL,
  author_location text,
  rating integer DEFAULT 5 NOT NULL,
  body text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.section_settings (
  id text NOT NULL,
  name text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  display_limit integer DEFAULT 8 NOT NULL,
  show_see_all boolean DEFAULT true NOT NULL,
  button_text text DEFAULT 'See All'::text NOT NULL,
  button_link text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  is_slider boolean DEFAULT false NOT NULL,
  slider_items integer DEFAULT 4,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  product_category text
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_type text NOT NULL,
  ip_address text,
  route text,
  actor_email text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_logos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  url text,
  storage_path text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id text DEFAULT 'default'::text NOT NULL,
  production_domain text DEFAULT 'customparadisebd.com'::text,
  business_name text DEFAULT 'Customz Paradise BD'::text,
  business_description text,
  tagline text,
  address text,
  city text DEFAULT 'Dhaka'::text,
  country text DEFAULT 'Bangladesh'::text,
  phone text,
  whatsapp text,
  email text,
  social_links jsonb DEFAULT '[]'::jsonb,
  business_hours jsonb DEFAULT '{}'::jsonb,
  main_branch_info text,
  branch_relationship text,
  default_meta_title text,
  default_meta_description text,
  organization_schema jsonb DEFAULT '{}'::jsonb,
  local_business_schema jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  platform text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.steadfast_stats (
  id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
  successful_submissions_count bigint DEFAULT 0,
  last_success_at timestamp with time zone,
  last_order_id uuid,
  last_invoice_no text,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id text DEFAULT 'default'::text NOT NULL,
  shipping_flat numeric DEFAULT 120 NOT NULL,
  zone_charges jsonb DEFAULT '{"dhaka_suburb": 150, "inside_dhaka": 120, "outside_dhaka": 180}'::jsonb NOT NULL,
  payment_methods jsonb DEFAULT '["cash_on_delivery", "bkash", "nagad", "bank_transfer"]'::jsonb NOT NULL,
  support_phone text DEFAULT '+8801890722202'::text NOT NULL,
  support_email text,
  low_stock_threshold integer DEFAULT 3 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  steadfast_enabled boolean DEFAULT false NOT NULL,
  steadfast_base_url text DEFAULT 'https://portal.packzy.com/api/v1'::text NOT NULL,
  whatsapp_phone text DEFAULT '+8801890722202'::text NOT NULL,
  whatsapp_message text DEFAULT 'Having any problem with your order? Contact us on WhatsApp.'::text NOT NULL,
  whatsapp_floating_enabled boolean DEFAULT true,
  whatsapp_floating_position text DEFAULT 'bottom-right'::text
);

CREATE TABLE IF NOT EXISTS public.stress_test_settings (
  id text DEFAULT 'default'::text NOT NULL,
  current_number integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  permission text NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------- SCHEMAS + FUNCTIONS ----------------
-- The `private` schema holds the security-definer role/permission helpers that
-- several RLS policies call. It MUST exist before the policy section runs.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- private.has_permission(uuid,text)
CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
    user_role public.app_role;
    user_perms text[];
    is_approved boolean;
BEGIN
    -- Get user role and status
    SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
    
    -- Check if user is approved (staff status check)
    -- This is a simplified version, usually we'd join with a staff table
    -- For now, if they have a role, we check permissions.
    
    IF user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- Basic role check
    IF user_role = 'admin' AND _permission != 'security.manage' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE; -- Default
END;
$function$;

-- private.has_role(uuid,app_role)
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$function$;

-- alert_on_invoice_collision()
CREATE OR REPLACE FUNCTION public.alert_on_invoice_collision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Create notification for all admins
    INSERT INTO public.admin_notifications (user_id, title, message, type, metadata)
    SELECT 
        ur.user_id,
        'DUPLICATE INVOICE DETECTED',
        'Collision detected for invoice ' || NEW.invoice_no || '. Security event logged.',
        'security',
        jsonb_build_object(
            'invoice_no', NEW.invoice_no,
            'collision_id', NEW.id,
            'timestamp', NEW.detected_at
        )
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'user'); 
    
    RETURN NEW;
END;
$function$;

-- generate_next_invoice_no()
CREATE OR REPLACE FUNCTION public.generate_next_invoice_no()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_prefix TEXT;
    v_num INTEGER;
    v_invoice_no TEXT;
BEGIN
    -- Acquire an exclusive row-level lock on the settings row.
    -- This forces concurrent calls to wait in line, ensuring each receives a unique number.
    SELECT prefix, GREATEST(start_number, current_number + 1)
    INTO v_prefix, v_num
    FROM public.invoice_settings
    WHERE id = 'default'
    FOR UPDATE;

    IF v_prefix IS NULL OR v_num IS NULL THEN
        RAISE EXCEPTION 'Invoice settings are not configured';
    END IF;

    v_invoice_no := v_prefix || '-' || CASE
        WHEN v_num < 10 THEN LPAD(v_num::TEXT, 2, '0')
        ELSE v_num::TEXT
    END;

    -- Persist the incremented number.
    UPDATE public.invoice_settings
    SET current_number = v_num,
        updated_at = NOW()
    WHERE id = 'default';

    RETURN v_invoice_no;
END;
$function$;

-- generate_next_invoice_no(boolean)
CREATE OR REPLACE FUNCTION public.generate_next_invoice_no(is_test boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_prefix TEXT;
    v_num INTEGER;
    v_invoice_no TEXT;
BEGIN
    -- Acquire lock and get settings
    IF is_test THEN
        SELECT 'TEST', GREATEST(1, current_number + 1)
        INTO v_prefix, v_num
        FROM public.stress_test_settings
        WHERE id = 'default'
        FOR UPDATE;
    ELSE
        SELECT prefix, GREATEST(start_number, current_number + 1)
        INTO v_prefix, v_num
        FROM public.invoice_settings
        WHERE id = 'default'
        FOR UPDATE;
    END IF;

    IF v_prefix IS NULL OR v_num IS NULL THEN
        RAISE EXCEPTION 'Invoice settings are not configured';
    END IF;

    v_invoice_no := v_prefix || '-' || CASE
        WHEN v_num < 10 THEN LPAD(v_num::TEXT, 2, '0')
        ELSE v_num::TEXT
    END;

    -- Update the sequence record
    IF is_test THEN
        UPDATE public.stress_test_settings
        SET current_number = v_num, updated_at = NOW()
        WHERE id = 'default';
    ELSE
        UPDATE public.invoice_settings
        SET current_number = v_num, updated_at = NOW()
        WHERE id = 'default';
    END IF;

    RETURN v_invoice_no;
END;
$function$;

-- handle_updated_at()
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- has_permission(uuid,text)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
  SELECT public.is_super_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.user_permissions up
    JOIN public.profiles p ON p.id = up.user_id
    WHERE up.user_id = _user_id AND up.permission = _permission AND p.access_status = 'approved'
  );
$function$;

-- has_role(uuid,app_role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$function$;

-- increment_steadfast_count(uuid,text)
CREATE OR REPLACE FUNCTION public.increment_steadfast_count(order_id uuid, invoice_no text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.steadfast_stats (id, successful_submissions_count, last_success_at, last_order_id, last_invoice_no, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 1, NOW(), order_id, invoice_no, NOW())
    ON CONFLICT (id) DO UPDATE SET
        successful_submissions_count = steadfast_stats.successful_submissions_count + 1,
        last_success_at = EXCLUDED.last_success_at,
        last_order_id = EXCLUDED.last_order_id,
        last_invoice_no = EXCLUDED.last_invoice_no,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

-- is_staff(uuid)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id
      AND r.role IN ('super_admin','admin','manager','staff')
      AND p.access_status = 'approved'
  );
$function$;

-- is_super_admin(uuid)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
$function$;

-- next_invoice_no()
CREATE OR REPLACE FUNCTION public.next_invoice_no()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 'CZP-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0');
$function$;

-- prevent_profile_privilege_escalation()
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  is_privileged boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  is_privileged := public.has_role(auth.uid(), 'admin'::app_role)
                or public.has_role(auth.uid(), 'super_admin'::app_role);

  if is_privileged then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.access_status := 'pending';
    new.mfa_required := false;
    new.approved_by := null;
    new.approved_at := null;
    return new;
  end if;

  new.access_status := old.access_status;
  new.mfa_required := old.mfa_required;
  new.approved_by := old.approved_by;
  new.approved_at := old.approved_at;
  return new;
end;
$function$;

-- touch_updated_at()
CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- tr_orders_assign_invoice_no()
CREATE OR REPLACE FUNCTION public.tr_orders_assign_invoice_no()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- ALWAYS use the generator if the invoice_no is null, empty, or 'AUTO'
    -- This ensures the DB is the source of truth
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' OR NEW.invoice_no = 'AUTO' THEN
        NEW.invoice_no := public.generate_next_invoice_no(false);
    END IF;
    RETURN NEW;
END;
$function$;

-- ---------------- CONSTRAINTS (PK, UNIQUE, CHECK, FK) ----------------

DO $$ BEGIN
  ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_sessions ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_settings ADD CONSTRAINT ai_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bike_models ADD CONSTRAINT bike_models_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.cities ADD CONSTRAINT cities_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_api_logs ADD CONSTRAINT courier_api_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_credentials ADD CONSTRAINT courier_credentials_pkey PRIMARY KEY (courier_id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_shipments ADD CONSTRAINT courier_shipments_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_tracking_events ADD CONSTRAINT courier_tracking_events_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.couriers ADD CONSTRAINT couriers_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customer_fraud_marks ADD CONSTRAINT customer_fraud_marks_pkey PRIMARY KEY (phone_number);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.delivery_zones ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.flash_sale_products ADD CONSTRAINT flash_sale_products_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.flash_sales ADD CONSTRAINT flash_sales_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.gallery_items ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.hero_slides ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.invoice_collisions ADD CONSTRAINT invoice_collisions_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.invoice_settings ADD CONSTRAINT invoice_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.login_attempts ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.mfa_backup_codes ADD CONSTRAINT mfa_backup_codes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.nav_items ADD CONSTRAINT nav_items_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.not_found_logs ADD CONSTRAINT not_found_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_damages ADD CONSTRAINT order_damages_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_events ADD CONSTRAINT order_events_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_returns ADD CONSTRAINT order_returns_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_stock_deductions ADD CONSTRAINT order_stock_deductions_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.product_360_images ADD CONSTRAINT product_360_images_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.product_colors ADD CONSTRAINT product_colors_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.section_settings ADD CONSTRAINT section_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.security_events ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.site_logos ADD CONSTRAINT site_logos_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.social_links ADD CONSTRAINT social_links_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.steadfast_stats ADD CONSTRAINT steadfast_stats_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.stress_test_settings ADD CONSTRAINT stress_test_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_sessions ADD CONSTRAINT admin_sessions_session_id_key UNIQUE (session_id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bike_models ADD CONSTRAINT bike_models_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.couriers ADD CONSTRAINT couriers_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD CONSTRAINT customers_phone_key UNIQUE (phone);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.delivery_zones ADD CONSTRAINT delivery_zones_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.flash_sale_products ADD CONSTRAINT flash_sale_products_flash_sale_id_product_id_key UNIQUE (flash_sale_id, product_id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_stock_deductions ADD CONSTRAINT order_stock_deductions_order_item_id_key UNIQUE (order_item_id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_idempotency_key_key UNIQUE (idempotency_key);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.product_colors ADD CONSTRAINT product_colors_product_id_name_key UNIQUE (product_id, name);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.site_logos ADD CONSTRAINT site_logos_category_key UNIQUE (category);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_id_permission_key UNIQUE (user_id, permission);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_settings ADD CONSTRAINT ai_settings_provider_check CHECK ((provider = ANY (ARRAY['gemini'::text, 'openai'::text, 'custom'::text])));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_settings ADD CONSTRAINT single_row CHECK ((id = 'default'::text));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.invoice_settings ADD CONSTRAINT only_one_row CHECK ((id = 'default'::text));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity_check CHECK ((quantity > 0));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_video_platform_check CHECK ((video_platform = ANY (ARRAY['youtube'::text, 'facebook'::text, 'instagram'::text, 'tiktok'::text])));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_access_status_check CHECK ((access_status = ANY (ARRAY['pending'::text, 'approved'::text, 'suspended'::text, 'revoked'::text])));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_single_row CHECK ((id = 'default'::text));
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_settings ADD CONSTRAINT ai_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_api_logs ADD CONSTRAINT courier_api_logs_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_api_logs ADD CONSTRAINT courier_api_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_credentials ADD CONSTRAINT courier_credentials_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_shipments ADD CONSTRAINT courier_shipments_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_shipments ADD CONSTRAINT courier_shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_tracking_events ADD CONSTRAINT courier_tracking_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.courier_tracking_events ADD CONSTRAINT courier_tracking_events_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES courier_shipments(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customer_fraud_marks ADD CONSTRAINT customer_fraud_marks_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD CONSTRAINT customers_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.flash_sale_products ADD CONSTRAINT flash_sale_products_flash_sale_id_fkey FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.flash_sale_products ADD CONSTRAINT flash_sale_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.hero_slides ADD CONSTRAINT hero_slides_bike_model_id_fkey FOREIGN KEY (bike_model_id) REFERENCES bike_models(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.invoice_collisions ADD CONSTRAINT invoice_collisions_existing_order_id_fkey FOREIGN KEY (existing_order_id) REFERENCES orders(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.invoice_settings ADD CONSTRAINT invoice_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.not_found_logs ADD CONSTRAINT not_found_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_damages ADD CONSTRAINT order_damages_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_damages ADD CONSTRAINT order_damages_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_damages ADD CONSTRAINT order_damages_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_events ADD CONSTRAINT order_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_returns ADD CONSTRAINT order_returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_returns ADD CONSTRAINT order_returns_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_returns ADD CONSTRAINT order_returns_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_stock_deductions ADD CONSTRAINT order_stock_deductions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_stock_deductions ADD CONSTRAINT order_stock_deductions_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_stock_deductions ADD CONSTRAINT order_stock_deductions_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.product_360_images ADD CONSTRAINT product_360_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.product_colors ADD CONSTRAINT product_colors_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.site_logos ADD CONSTRAINT site_logos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.steadfast_stats ADD CONSTRAINT steadfast_stats_last_order_id_fkey FOREIGN KEY (last_order_id) REFERENCES orders(id);
EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL;
END $$;

-- ---------------- INDEXES ----------------

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_id ON public.admin_audit_log USING btree (actor_id);

CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON public.admin_sessions USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS cities_name_key ON public.cities USING btree (lower(name));

CREATE INDEX IF NOT EXISTS courier_shipments_order_active_idx ON public.courier_shipments USING btree (order_id) WHERE (is_active AND success);

CREATE INDEX IF NOT EXISTS courier_shipments_order_idx ON public.courier_shipments USING btree (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_fraud_phone ON public.customer_fraud_marks USING btree (phone_number);

CREATE INDEX IF NOT EXISTS idx_flash_sale_products_product ON public.flash_sale_products USING btree (product_id);

CREATE INDEX IF NOT EXISTS inventory_movements_product_idx ON public.inventory_movements USING btree (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON public.login_attempts USING btree (email_key, created_at DESC);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON public.order_events USING btree (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items USING btree (order_id);

CREATE INDEX IF NOT EXISTS orders_active_idx ON public.orders USING btree (deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_assigned_idx ON public.orders USING btree (assigned_to);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_invoice_no_idx ON public.orders USING btree (invoice_no);

CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders USING btree (payment_status);

CREATE INDEX IF NOT EXISTS orders_phone_idx ON public.orders USING btree (customer_phone);

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders USING btree (status);

CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments USING btree (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS product_colors_product_idx ON public.product_colors USING btree (product_id);

CREATE INDEX IF NOT EXISTS products_active_idx ON public.products USING btree (is_active, deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products USING btree (lower(sku)) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products USING btree (lower(slug)) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events USING btree (ip_address);

-- ---------------- TRIGGERS ----------------

DROP TRIGGER IF EXISTS brands_touch_updated_at ON public.brands;
CREATE TRIGGER brands_touch_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS categories_touch_updated_at ON public.categories;
CREATE TRIGGER categories_touch_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS cities_touch_updated_at ON public.cities;
CREATE TRIGGER cities_touch_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS couriers_touch_updated_at ON public.couriers;
CREATE TRIGGER couriers_touch_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS customers_touch_updated_at ON public.customers;
CREATE TRIGGER customers_touch_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS delivery_zones_touch_updated_at ON public.delivery_zones;
CREATE TRIGGER delivery_zones_touch_updated_at BEFORE UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS flash_sales_touch_updated_at ON public.flash_sales;
CREATE TRIGGER flash_sales_touch_updated_at BEFORE UPDATE ON public.flash_sales FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS tr_gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER tr_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS hero_slides_touch_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_touch_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trigger_invoice_collision_alert ON public.invoice_collisions;
CREATE TRIGGER trigger_invoice_collision_alert AFTER INSERT ON public.invoice_collisions FOR EACH ROW EXECUTE FUNCTION alert_on_invoice_collision();

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS nav_items_touch_updated_at ON public.nav_items;
CREATE TRIGGER nav_items_touch_updated_at BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS tr_orders_invoice_no ON public.orders;
CREATE TRIGGER tr_orders_invoice_no BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION tr_orders_assign_invoice_no();

DROP TRIGGER IF EXISTS product_colors_touch_updated_at ON public.product_colors;
CREATE TRIGGER product_colors_touch_updated_at BEFORE UPDATE ON public.product_colors FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_escalation BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_profile_privilege_escalation();

DROP TRIGGER IF EXISTS reviews_touch_updated_at ON public.reviews;
CREATE TRIGGER reviews_touch_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS social_links_touch_updated_at ON public.social_links;
CREATE TRIGGER social_links_touch_updated_at BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS store_settings_touch_updated_at ON public.store_settings;
CREATE TRIGGER store_settings_touch_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS suppliers_touch_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_touch_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------------- GRANTS ----------------

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_audit_log TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_audit_log TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_audit_log TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_notifications TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_notifications TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_notifications TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_sessions TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_sessions TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_sessions TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.ai_settings TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.ai_settings TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.ai_settings TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.bike_models TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.bike_models TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.bike_models TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.brands TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.brands TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.brands TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.categories TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.categories TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.categories TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.cities TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.cities TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.cities TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_api_logs TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_api_logs TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_api_logs TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_credentials TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_credentials TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_credentials TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_shipments TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_shipments TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_shipments TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_tracking_events TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_tracking_events TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.courier_tracking_events TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.couriers TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.couriers TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.couriers TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.customer_fraud_marks TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.customer_fraud_marks TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.customer_fraud_marks TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.customers TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.customers TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.customers TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.delivery_zones TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.delivery_zones TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.delivery_zones TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.flash_sale_products TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.flash_sale_products TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.flash_sale_products TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.flash_sales TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.flash_sales TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.flash_sales TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.gallery_items TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.gallery_items TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.gallery_items TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.hero_slides TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.hero_slides TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.hero_slides TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.inventory_movements TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.inventory_movements TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.inventory_movements TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.invoice_collisions TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.invoice_collisions TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.invoice_collisions TO service_role;

-- invoice_settings is admin-only: no anon grant (matches live project, 2026-08-27).
GRANT SELECT, INSERT, UPDATE ON public.invoice_settings TO authenticated;

GRANT ALL ON public.invoice_settings TO service_role;

-- Invoice number generators are service-role only.
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.leads TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.leads TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.leads TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.login_attempts TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.login_attempts TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.login_attempts TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.mfa_backup_codes TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.mfa_backup_codes TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.mfa_backup_codes TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.nav_items TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.nav_items TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.nav_items TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.not_found_logs TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.not_found_logs TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.not_found_logs TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_damages TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_damages TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_damages TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_events TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_events TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_events TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_items TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_items TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_items TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_returns TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_returns TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_returns TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_stock_deductions TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_stock_deductions TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.order_stock_deductions TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.orders TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.orders TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.orders TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.payments TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.payments TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.payments TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.product_360_images TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.product_360_images TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.product_360_images TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.product_colors TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.product_colors TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.product_colors TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.products TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.products TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.products TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.reviews TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.reviews TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.reviews TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.section_settings TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.section_settings TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.section_settings TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.security_events TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.security_events TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.security_events TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_logos TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_logos TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_logos TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_settings TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_settings TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_settings TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.social_links TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.social_links TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.social_links TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.steadfast_stats TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.steadfast_stats TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.steadfast_stats TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.store_settings TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.store_settings TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.store_settings TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.stress_test_settings TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.stress_test_settings TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.stress_test_settings TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.suppliers TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.suppliers TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.suppliers TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_permissions TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_permissions TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_permissions TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO service_role;

GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.invoice_number_seq TO anon;

GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.invoice_number_seq TO authenticated;

GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.invoice_number_seq TO service_role;

GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.invoice_seq TO anon;

GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.invoice_seq TO authenticated;

GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.invoice_seq TO service_role;

-- ---------------- ROW LEVEL SECURITY + POLICIES ----------------

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bike_models ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courier_api_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courier_credentials ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courier_shipments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courier_tracking_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customer_fraud_marks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invoice_collisions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.not_found_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_damages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_stock_deductions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_360_images ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.section_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.site_logos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.steadfast_stats ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stress_test_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Super admins can view audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Users can see their own notifications" ON public.admin_notifications;
CREATE POLICY "Users can see their own notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role)));

DROP POLICY IF EXISTS "View own or all sessions as super admin" ON public.admin_sessions;
CREATE POLICY "View own or all sessions as super admin" ON public.admin_sessions FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Admins can update AI settings" ON public.ai_settings;
CREATE POLICY "Admins can update AI settings" ON public.ai_settings FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Admins can view AI settings" ON public.ai_settings;
CREATE POLICY "Admins can view AI settings" ON public.ai_settings FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Privileged staff can manage bike models" ON public.bike_models;
CREATE POLICY "Privileged staff can manage bike models" ON public.bike_models FOR ALL TO authenticated USING ((private.has_role(auth.uid(), 'super_admin'::app_role) OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((private.has_role(auth.uid(), 'super_admin'::app_role) OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role)));

DROP POLICY IF EXISTS "Public read-only for active models" ON public.bike_models;
CREATE POLICY "Public read-only for active models" ON public.bike_models FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Product staff can insert brands" ON public.brands;
CREATE POLICY "Product staff can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Product staff can update brands" ON public.brands;
CREATE POLICY "Product staff can update brands" ON public.brands FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'products.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Public can read active brands" ON public.brands;
CREATE POLICY "Public can read active brands" ON public.brands FOR SELECT TO anon USING (is_active);

DROP POLICY IF EXISTS "Staff can read brands" ON public.brands;
CREATE POLICY "Staff can read brands" ON public.brands FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Super admin can delete brands" ON public.brands;
CREATE POLICY "Super admin can delete brands" ON public.brands FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Product staff can insert categories" ON public.categories;
CREATE POLICY "Product staff can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Product staff can update categories" ON public.categories;
CREATE POLICY "Product staff can update categories" ON public.categories FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'products.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Public can read active categories" ON public.categories;
CREATE POLICY "Public can read active categories" ON public.categories FOR SELECT TO anon USING (is_active);

DROP POLICY IF EXISTS "Staff can read categories" ON public.categories;
CREATE POLICY "Staff can read categories" ON public.categories FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Super admin can delete categories" ON public.categories;
CREATE POLICY "Super admin can delete categories" ON public.categories FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view active cities" ON public.cities;
CREATE POLICY "Public can view active cities" ON public.cities FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view cities" ON public.cities;
CREATE POLICY "Staff can view cities" ON public.cities FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Zone managers can write cities" ON public.cities;
CREATE POLICY "Zone managers can write cities" ON public.cities FOR ALL TO authenticated USING (has_permission(auth.uid(), 'zones.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'zones.manage'::text));

DROP POLICY IF EXISTS "Staff can view courier logs" ON public.courier_api_logs;
CREATE POLICY "Staff can view courier logs" ON public.courier_api_logs FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Service role only" ON public.courier_credentials;
CREATE POLICY "Service role only" ON public.courier_credentials FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Staff can create courier shipments" ON public.courier_shipments;
CREATE POLICY "Staff can create courier shipments" ON public.courier_shipments FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update courier shipments" ON public.courier_shipments;
CREATE POLICY "Staff can update courier shipments" ON public.courier_shipments FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view courier shipments" ON public.courier_shipments;
CREATE POLICY "Staff can view courier shipments" ON public.courier_shipments FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can create tracking events" ON public.courier_tracking_events;
CREATE POLICY "Staff can create tracking events" ON public.courier_tracking_events FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view tracking events" ON public.courier_tracking_events;
CREATE POLICY "Staff can view tracking events" ON public.courier_tracking_events FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Courier managers can create couriers" ON public.couriers;
CREATE POLICY "Courier managers can create couriers" ON public.couriers FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'couriers.manage'::text));

DROP POLICY IF EXISTS "Courier managers can update couriers" ON public.couriers;
CREATE POLICY "Courier managers can update couriers" ON public.couriers FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'couriers.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'couriers.manage'::text));

DROP POLICY IF EXISTS "Staff can view couriers" ON public.couriers;
CREATE POLICY "Staff can view couriers" ON public.couriers FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete couriers" ON public.couriers;
CREATE POLICY "Super admins can delete couriers" ON public.couriers FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage fraud marks" ON public.customer_fraud_marks;
CREATE POLICY "Admins can manage fraud marks" ON public.customer_fraud_marks FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Staff can view fraud marks" ON public.customer_fraud_marks;
CREATE POLICY "Staff can view fraud marks" ON public.customer_fraud_marks FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Customer staff can insert customers" ON public.customers;
CREATE POLICY "Customer staff can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'customers.manage'::text));

DROP POLICY IF EXISTS "Customer staff can update customers" ON public.customers;
CREATE POLICY "Customer staff can update customers" ON public.customers FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'customers.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'customers.manage'::text));

DROP POLICY IF EXISTS "Staff can read customers" ON public.customers;
CREATE POLICY "Staff can read customers" ON public.customers FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
CREATE POLICY "Staff can view customers" ON public.customers FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

DROP POLICY IF EXISTS "Public can view active zones" ON public.delivery_zones;
CREATE POLICY "Public can view active zones" ON public.delivery_zones FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view zones" ON public.delivery_zones;
CREATE POLICY "Staff can view zones" ON public.delivery_zones FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Zone managers can write zones" ON public.delivery_zones;
CREATE POLICY "Zone managers can write zones" ON public.delivery_zones FOR ALL TO authenticated USING (has_permission(auth.uid(), 'zones.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'zones.manage'::text));

DROP POLICY IF EXISTS "Public can view flash sale products" ON public.flash_sale_products;
CREATE POLICY "Public can view flash sale products" ON public.flash_sale_products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can delete flash sale products" ON public.flash_sale_products;
CREATE POLICY "Staff can delete flash sale products" ON public.flash_sale_products FOR DELETE TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert flash sale products" ON public.flash_sale_products;
CREATE POLICY "Staff can insert flash sale products" ON public.flash_sale_products FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update flash sale products" ON public.flash_sale_products;
CREATE POLICY "Staff can update flash sale products" ON public.flash_sale_products FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Public can view flash sales" ON public.flash_sales;
CREATE POLICY "Public can view flash sales" ON public.flash_sales FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can delete flash sales" ON public.flash_sales;
CREATE POLICY "Staff can delete flash sales" ON public.flash_sales FOR DELETE TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert flash sales" ON public.flash_sales;
CREATE POLICY "Staff can insert flash sales" ON public.flash_sales FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update flash sales" ON public.flash_sales;
CREATE POLICY "Staff can update flash sales" ON public.flash_sales FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active gallery items" ON public.gallery_items;
CREATE POLICY "Anyone can view active gallery items" ON public.gallery_items FOR SELECT USING (((is_active = true) OR ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role))));

DROP POLICY IF EXISTS "Staff can manage gallery items" ON public.gallery_items;
CREATE POLICY "Staff can manage gallery items" ON public.gallery_items FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

DROP POLICY IF EXISTS "Admins can manage slides" ON public.hero_slides;
CREATE POLICY "Admins can manage slides" ON public.hero_slides FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Content managers can write slides" ON public.hero_slides;
CREATE POLICY "Content managers can write slides" ON public.hero_slides FOR ALL TO authenticated USING (has_permission(auth.uid(), 'content.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'content.manage'::text));

DROP POLICY IF EXISTS "Public can view active slides" ON public.hero_slides;
CREATE POLICY "Public can view active slides" ON public.hero_slides FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view slides" ON public.hero_slides;
CREATE POLICY "Staff can view slides" ON public.hero_slides FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Product staff can add stock movements" ON public.inventory_movements;
CREATE POLICY "Product staff can add stock movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Staff can read stock movements" ON public.inventory_movements;
CREATE POLICY "Staff can read stock movements" ON public.inventory_movements FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can view collisions" ON public.invoice_collisions;
CREATE POLICY "Admins can view collisions" ON public.invoice_collisions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Admins can manage invoice settings" ON public.invoice_settings;
CREATE POLICY "Admins can manage invoice settings" ON public.invoice_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid())) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff can read invoice settings" ON public.invoice_settings;
CREATE POLICY "Staff can read invoice settings" ON public.invoice_settings FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;
CREATE POLICY "Public can submit leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;
CREATE POLICY "Service role can manage login attempts" ON public.login_attempts FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role can manage mfa codes" ON public.mfa_backup_codes;
CREATE POLICY "Service role can manage mfa codes" ON public.mfa_backup_codes FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Staff can view mfa stats" ON public.mfa_backup_codes;
CREATE POLICY "Staff can view mfa stats" ON public.mfa_backup_codes FOR SELECT TO authenticated USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Content managers can write nav" ON public.nav_items;
CREATE POLICY "Content managers can write nav" ON public.nav_items FOR ALL TO authenticated USING (has_permission(auth.uid(), 'content.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'content.manage'::text));

DROP POLICY IF EXISTS "Public can view active nav" ON public.nav_items;
CREATE POLICY "Public can view active nav" ON public.nav_items FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view nav" ON public.nav_items;
CREATE POLICY "Staff can view nav" ON public.nav_items FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can view 404 logs" ON public.not_found_logs;
CREATE POLICY "Admins can view 404 logs" ON public.not_found_logs FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Anyone can log a 404" ON public.not_found_logs;
CREATE POLICY "Anyone can log a 404" ON public.not_found_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can see damages" ON public.order_damages;
CREATE POLICY "Staff can see damages" ON public.order_damages FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can create order events" ON public.order_events;
CREATE POLICY "Staff can create order events" ON public.order_events FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view order events" ON public.order_events;
CREATE POLICY "Staff can view order events" ON public.order_events FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can create order items" ON public.order_items;
CREATE POLICY "Staff can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;
CREATE POLICY "Staff can view order items" ON public.order_items FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can see returns" ON public.order_returns;
CREATE POLICY "Staff can see returns" ON public.order_returns FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can see deductions" ON public.order_stock_deductions;
CREATE POLICY "Admins can see deductions" ON public.order_stock_deductions FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Staff can create orders" ON public.orders;
CREATE POLICY "Staff can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;
CREATE POLICY "Staff can view orders" ON public.orders FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Order staff can add payments" ON public.payments;
CREATE POLICY "Order staff can add payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'orders.manage'::text));

DROP POLICY IF EXISTS "Staff can read payments" ON public.payments;
CREATE POLICY "Staff can read payments" ON public.payments FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage 360 images" ON public.product_360_images;
CREATE POLICY "Admins can manage 360 images" ON public.product_360_images FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Anyone can view 360 images" ON public.product_360_images;
CREATE POLICY "Anyone can view 360 images" ON public.product_360_images FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Product managers can write colours" ON public.product_colors;
CREATE POLICY "Product managers can write colours" ON public.product_colors FOR ALL TO authenticated USING (has_permission(auth.uid(), 'products.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Public can view active colours" ON public.product_colors;
CREATE POLICY "Public can view active colours" ON public.product_colors FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view colours" ON public.product_colors;
CREATE POLICY "Staff can view colours" ON public.product_colors FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Product managers can create products" ON public.products;
CREATE POLICY "Product managers can create products" ON public.products FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Product managers can update products" ON public.products;
CREATE POLICY "Product managers can update products" ON public.products FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'products.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT TO anon USING (((is_active = true) AND (deleted_at IS NULL)));

DROP POLICY IF EXISTS "Staff can view all products" ON public.products;
CREATE POLICY "Staff can view all products" ON public.products FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Super admins can permanently delete products" ON public.products;
CREATE POLICY "Super admins can permanently delete products" ON public.products FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Content managers can write reviews" ON public.reviews;
CREATE POLICY "Content managers can write reviews" ON public.reviews FOR ALL TO authenticated USING (has_permission(auth.uid(), 'content.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'content.manage'::text));

DROP POLICY IF EXISTS "Public can view active reviews" ON public.reviews;
CREATE POLICY "Public can view active reviews" ON public.reviews FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view reviews" ON public.reviews;
CREATE POLICY "Staff can view reviews" ON public.reviews FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Allow admins to manage section settings" ON public.section_settings;
CREATE POLICY "Allow admins to manage section settings" ON public.section_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow public read-only access" ON public.section_settings;
CREATE POLICY "Allow public read-only access" ON public.section_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can view security events" ON public.security_events;
CREATE POLICY "Admins can view security events" ON public.security_events FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Admin Manage Site Logos" ON public.site_logos;
CREATE POLICY "Admin Manage Site Logos" ON public.site_logos FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Public Read Site Logos" ON public.site_logos;
CREATE POLICY "Public Read Site Logos" ON public.site_logos FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Content managers can write social links" ON public.social_links;
CREATE POLICY "Content managers can write social links" ON public.social_links FOR ALL TO authenticated USING (has_permission(auth.uid(), 'content.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'content.manage'::text));

DROP POLICY IF EXISTS "Public can view active social links" ON public.social_links;
CREATE POLICY "Public can view active social links" ON public.social_links FOR SELECT TO anon USING ((is_active = true));

DROP POLICY IF EXISTS "Staff can view social links" ON public.social_links;
CREATE POLICY "Staff can view social links" ON public.social_links FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can view steadfast stats" ON public.steadfast_stats;
CREATE POLICY "Admins can view steadfast stats" ON public.steadfast_stats FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role can manage steadfast stats" ON public.steadfast_stats;
CREATE POLICY "Service role can manage steadfast stats" ON public.steadfast_stats FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Staff with product permission can update store settings" ON public.store_settings;
CREATE POLICY "Staff with product permission can update store settings" ON public.store_settings FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'products.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Store settings are publicly readable" ON public.store_settings;
CREATE POLICY "Store settings are publicly readable" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role only" ON public.stress_test_settings;
CREATE POLICY "Service role only" ON public.stress_test_settings FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Product staff can insert suppliers" ON public.suppliers;
CREATE POLICY "Product staff can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Product staff can update suppliers" ON public.suppliers;
CREATE POLICY "Product staff can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'products.manage'::text)) WITH CHECK (has_permission(auth.uid(), 'products.manage'::text));

DROP POLICY IF EXISTS "Staff can read suppliers" ON public.suppliers;
CREATE POLICY "Staff can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Super admin can delete suppliers" ON public.suppliers;
CREATE POLICY "Super admin can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
CREATE POLICY "Users can view own permissions" ON public.user_permissions FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));
