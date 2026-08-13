-- Update the order creation logic to use the secure ID generation function
CREATE OR REPLACE FUNCTION public.set_order_invoice_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
        NEW.invoice_no := public.generate_czp_invoice_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS tr_set_order_invoice_id ON public.orders;
CREATE TRIGGER tr_set_order_invoice_id
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_invoice_id();

-- Fix potential linter warnings by setting search_path
ALTER FUNCTION public.generate_czp_invoice_id() SET search_path = public;
ALTER FUNCTION public.set_order_invoice_id() SET search_path = public;
