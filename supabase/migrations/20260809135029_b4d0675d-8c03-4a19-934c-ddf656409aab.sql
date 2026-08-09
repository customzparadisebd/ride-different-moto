ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_zone text,
  ADD COLUMN IF NOT EXISTS advance_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS courier_tracking_id text,
  ADD COLUMN IF NOT EXISTS courier_status text NOT NULL DEFAULT 'not_booked',
  ADD COLUMN IF NOT EXISTS internal_notes text;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant text,
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);