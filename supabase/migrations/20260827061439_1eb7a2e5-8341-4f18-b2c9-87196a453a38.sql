ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_invoice_no_key;
DROP INDEX IF EXISTS public.orders_invoice_no_uidx;

CREATE INDEX IF NOT EXISTS orders_invoice_no_idx
ON public.orders (invoice_no);

CREATE OR REPLACE FUNCTION public.generate_next_invoice_no()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_prefix text;
    v_num integer;
    v_invoice_no text;
BEGIN
    SELECT prefix, GREATEST(start_number, current_number + 1)
    INTO v_prefix, v_num
    FROM public.invoice_settings
    WHERE id = 'default'
    FOR UPDATE;

    IF v_prefix IS NULL OR v_num IS NULL THEN
        RAISE EXCEPTION 'Invoice settings are not configured';
    END IF;

    v_invoice_no := v_prefix || '-' || CASE
        WHEN v_num < 10 THEN LPAD(v_num::text, 2, '0')
        ELSE v_num::text
    END;

    UPDATE public.invoice_settings
    SET current_number = v_num,
        updated_at = NOW()
    WHERE id = 'default';

    RETURN v_invoice_no;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_next_invoice_no(is_test boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_prefix text;
    v_num integer;
    v_invoice_no text;
BEGIN
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
        WHEN v_num < 10 THEN LPAD(v_num::text, 2, '0')
        ELSE v_num::text
    END;

    IF is_test THEN
        UPDATE public.stress_test_settings
        SET current_number = v_num,
            updated_at = NOW()
        WHERE id = 'default';
    ELSE
        UPDATE public.invoice_settings
        SET current_number = v_num,
            updated_at = NOW()
        WHERE id = 'default';
    END IF;

    RETURN v_invoice_no;
END;
$function$;