-- We need a way to generate a sequential number for the invoices.
-- Using a sequence is the most reliable way to handle this concurrently.
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

-- Create a function to generate the formatted invoice ID
CREATE OR REPLACE FUNCTION public.generate_czp_invoice_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_val BIGINT;
    formatted_id TEXT;
BEGIN
    LOOP
        next_val := nextval('public.invoice_number_seq');
        formatted_id := 'CZP-' || LPAD(next_val::TEXT, 2, '0');
        
        -- Check if it already exists (safety check for sequence manipulation)
        IF NOT EXISTS (SELECT 1 FROM public.orders WHERE invoice_no = formatted_id) THEN
            RETURN formatted_id;
        END IF;
    END LOOP;
END;
$$;

-- Update the orders table to ensure invoice_no is unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_invoice_no_key'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_invoice_no_key UNIQUE (invoice_no);
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.generate_czp_invoice_id() TO authenticated, service_role;
