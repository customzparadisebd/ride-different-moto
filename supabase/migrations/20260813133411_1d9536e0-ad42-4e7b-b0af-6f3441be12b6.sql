-- INVOICE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.invoice_settings (
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

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'Staff can read invoice settings'
    ) THEN
        ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Staff can read invoice settings" ON public.invoice_settings
            FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Admins can update invoice settings" ON public.invoice_settings
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

INSERT INTO public.invoice_settings (id, prefix, start_number, current_number)
VALUES ('default', 'CZP', 1, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.orders ALTER COLUMN invoice_no SET NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_next_invoice_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_prefix TEXT;
    v_num INTEGER;
    v_invoice_no TEXT;
    v_exists BOOLEAN;
BEGIN
    SELECT prefix, GREATEST(start_number, current_number + 1)
    INTO v_prefix, v_num
    FROM public.invoice_settings
    WHERE id = 'default'
    FOR UPDATE;

    LOOP
        v_invoice_no := v_prefix || '-' || LPAD(v_num::TEXT, 2, '0');
        
        SELECT EXISTS (SELECT 1 FROM public.orders WHERE invoice_no = v_invoice_no AND deleted_at IS NULL)
        INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        v_num := v_num + 1;
    END LOOP;

    UPDATE public.invoice_settings
    SET current_number = v_num,
        updated_at = NOW()
    WHERE id = 'default';

    RETURN v_invoice_no;
END;
$func$;

CREATE OR REPLACE FUNCTION public.tr_orders_assign_invoice_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' OR NEW.invoice_no LIKE 'CZP-%' OR NEW.invoice_no LIKE 'TEMP-%' THEN
        NEW.invoice_no := public.generate_next_invoice_no();
    END IF;
    RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS tr_orders_invoice_no ON public.orders;
CREATE TRIGGER tr_orders_invoice_no
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.tr_orders_assign_invoice_no();