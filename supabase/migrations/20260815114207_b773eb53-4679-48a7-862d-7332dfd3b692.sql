-- 1. Create a separate sequence for stress testing
CREATE TABLE IF NOT EXISTS public.stress_test_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    current_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.stress_test_settings (id, current_number) 
VALUES ('default', 0) 
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, UPDATE ON public.stress_test_settings TO authenticated;
GRANT ALL ON public.stress_test_settings TO service_role;

-- 2. Update the invoice generation function to support a test mode
-- and ensure it respects the database UNIQUE constraint by handling collisions.
CREATE OR REPLACE FUNCTION public.generate_next_invoice_no(is_test BOOLEAN DEFAULT FALSE)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_prefix TEXT;
    v_num INTEGER;
    v_invoice_no TEXT;
    v_exists BOOLEAN;
    v_settings_table TEXT := CASE WHEN is_test THEN 'stress_test_settings' ELSE 'invoice_settings' END;
BEGIN
    -- Acquire lock based on mode
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

    LOOP
        v_invoice_no := v_prefix || '-' || LPAD(v_num::TEXT, 2, '0');
        
        -- Check for existence
        SELECT EXISTS (SELECT 1 FROM public.orders WHERE invoice_no = v_invoice_no)
        INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        v_num := v_num + 1;
    END LOOP;

    -- Update the correct sequence
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

-- 3. Add a log for duplicate invoice detections
CREATE TABLE IF NOT EXISTS public.invoice_collisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT NOT NULL,
    existing_order_id UUID REFERENCES public.orders(id),
    attempted_order_payload JSONB,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.invoice_collisions TO authenticated;
GRANT ALL ON public.invoice_collisions TO service_role;
ALTER TABLE public.invoice_collisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view collisions" ON public.invoice_collisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
