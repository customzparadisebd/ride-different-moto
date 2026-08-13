-- INVOICE SETTINGS TABLE
-- Purpose: Store the prefix and starting sequence for orders.
-- Security: Read by all authenticated staff, write only by Admin/Super Admin.
CREATE TABLE public.invoice_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    prefix TEXT NOT NULL DEFAULT 'CZP',
    start_number INTEGER NOT NULL DEFAULT 1,
    current_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT only_one_row CHECK (id = 'default')
);

GRANT SELECT ON public.invoice_settings TO authenticated;
GRANT ALL ON public.invoice_settings TO service_role;

ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read invoice settings" ON public.invoice_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update invoice settings" ON public.invoice_settings
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Initial row
INSERT INTO public.invoice_settings (id, prefix, start_number, current_number)
VALUES ('default', 'CZP', 1, 0)
ON CONFLICT (id) DO NOTHING;

-- UPDATE ORDERS TABLE
-- Add unique constraint to invoice_no if it doesn't have one
-- and ensure it's not null.
ALTER TABLE public.orders ALTER COLUMN invoice_no SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_no_uidx ON public.orders(invoice_no) WHERE deleted_at IS NULL;

-- INVOICE GENERATION FUNCTION
-- Purpose: Atomicly increments the sequence and returns the formatted string.
CREATE OR REPLACE FUNCTION public.generate_next_invoice_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prefix TEXT;
    v_num INTEGER;
    v_invoice_no TEXT;
    v_exists BOOLEAN;
BEGIN
    -- 1. Get current settings and lock the row
    SELECT prefix, GREATEST(start_number, current_number + 1)
    INTO v_prefix, v_num
    FROM public.invoice_settings
    WHERE id = 'default'
    FOR UPDATE;

    -- 2. Generate and check for collisions (paranoia check)
    LOOP
        v_invoice_no := v_prefix || '-' || LPAD(v_num::TEXT, 2, '0');
        
        SELECT EXISTS (SELECT 1 FROM public.orders WHERE invoice_no = v_invoice_no AND deleted_at IS NULL)
        INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        v_num := v_num + 1;
    END LOOP;

    -- 3. Update the sequence
    UPDATE public.invoice_settings
    SET current_number = v_num,
        updated_at = NOW()
    WHERE id = 'default';

    RETURN v_invoice_no;
END;
$$;

-- TRIGGER TO AUTO-ASSIGN INVOICE NO
-- Purpose: Ensures every order gets the current sequence if one isn't provided.
CREATE OR REPLACE FUNCTION public.tr_orders_assign_invoice_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' OR NEW.invoice_no LIKE 'CZP-%' OR NEW.invoice_no LIKE 'TEMP-%' THEN
        NEW.invoice_no := public.generate_next_invoice_no();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_orders_invoice_no ON public.orders;
CREATE TRIGGER tr_orders_invoice_no
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.tr_orders_assign_invoice_no();
