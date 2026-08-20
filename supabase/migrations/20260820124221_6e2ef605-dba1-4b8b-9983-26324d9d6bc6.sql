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
    v_exists BOOLEAN;
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

    -- Ensure we find a unique invoice number by incrementing until one is available
    LOOP
        v_invoice_no := v_prefix || '-' || LPAD(v_num::TEXT, 2, '0');
        
        SELECT EXISTS (SELECT 1 FROM public.orders WHERE invoice_no = v_invoice_no)
        INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        v_num := v_num + 1;
    END LOOP;

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