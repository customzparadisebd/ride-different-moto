
-- 1. Unify invoice generation: remove redundant triggers and functions.
DROP TRIGGER IF EXISTS tr_set_order_invoice_id ON public.orders;
DROP FUNCTION IF EXISTS public.set_order_invoice_id();
DROP FUNCTION IF EXISTS public.generate_czp_invoice_id();

-- 2. Update the remaining trigger function to be robust.
CREATE OR REPLACE FUNCTION public.tr_orders_assign_invoice_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' OR NEW.invoice_no = 'AUTO' THEN
        NEW.invoice_no := public.generate_next_invoice_no(false);
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Ensure the primary trigger is correctly attached.
DROP TRIGGER IF EXISTS tr_orders_invoice_no ON public.orders;
CREATE TRIGGER tr_orders_invoice_no
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_orders_assign_invoice_no();

-- 4. Clean up the 'orders' table default to prevent conflicts.
ALTER TABLE public.orders ALTER COLUMN invoice_no DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN invoice_no SET NOT NULL;

-- 5. Ensure the 'invoice_settings' row exists and is seeded.
INSERT INTO public.invoice_settings (id, prefix, start_number, current_number)
VALUES ('default', 'CZP', 1, 45)
ON CONFLICT (id) DO NOTHING;
