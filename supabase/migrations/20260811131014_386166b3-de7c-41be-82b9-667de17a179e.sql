CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cities_name_key ON public.cities (lower(name));

GRANT SELECT ON public.cities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT ALL ON public.cities TO service_role;

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active cities" ON public.cities
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Staff can view cities" ON public.cities
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

CREATE POLICY "Zone managers can write cities" ON public.cities
  FOR ALL TO authenticated
  USING (has_permission(auth.uid(), 'zones.manage'))
  WITH CHECK (has_permission(auth.uid(), 'zones.manage'));

CREATE TRIGGER cities_touch_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.delivery_zones (slug, name, charge, is_active, sort_order) VALUES
  ('inside_dhaka', 'Inside Dhaka', 200, true, 1),
  ('dhaka_suburb', 'Suburban Dhaka', 200, true, 2),
  ('outside_dhaka', 'Outside Dhaka', 200, true, 3)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS whatsapp_phone text NOT NULL DEFAULT '+8801890722202',
  ADD COLUMN IF NOT EXISTS whatsapp_message text NOT NULL DEFAULT 'Having any problem with your order? Contact us on WhatsApp.';

INSERT INTO public.cities (name, sort_order) VALUES
  ('Dhaka', 1), ('Gazipur', 2), ('Narayanganj', 3), ('Narsingdi', 4), ('Manikganj', 5),
  ('Munshiganj', 6), ('Kishoreganj', 7), ('Tangail', 8), ('Faridpur', 9), ('Gopalganj', 10),
  ('Madaripur', 11), ('Rajbari', 12), ('Shariatpur', 13), ('Chattogram', 14), ('Cox''s Bazar', 15),
  ('Cumilla', 16), ('Brahmanbaria', 17), ('Chandpur', 18), ('Feni', 19), ('Lakshmipur', 20),
  ('Noakhali', 21), ('Khagrachhari', 22), ('Rangamati', 23), ('Bandarban', 24), ('Sylhet', 25),
  ('Moulvibazar', 26), ('Habiganj', 27), ('Sunamganj', 28), ('Rajshahi', 29), ('Bogura', 30),
  ('Pabna', 31), ('Sirajganj', 32), ('Natore', 33), ('Naogaon', 34), ('Joypurhat', 35),
  ('Chapainawabganj', 36), ('Rangpur', 37), ('Dinajpur', 38), ('Thakurgaon', 39), ('Panchagarh', 40),
  ('Nilphamari', 41), ('Lalmonirhat', 42), ('Kurigram', 43), ('Gaibandha', 44), ('Khulna', 45),
  ('Jashore', 46), ('Kushtia', 47), ('Satkhira', 48), ('Bagerhat', 49), ('Jhenaidah', 50),
  ('Magura', 51), ('Narail', 52), ('Chuadanga', 53), ('Meherpur', 54), ('Barishal', 55),
  ('Patuakhali', 56), ('Bhola', 57), ('Pirojpur', 58), ('Barguna', 59), ('Jhalokathi', 60),
  ('Mymensingh', 61), ('Jamalpur', 62), ('Netrokona', 63), ('Sherpur', 64)
ON CONFLICT DO NOTHING;