-- Secure Invoice Serial Generation with explicit locking
CREATE OR REPLACE FUNCTION public.generate_next_invoice_no()
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
    -- Acquire an exclusive row-level lock on the settings row.
    -- This forces concurrent calls to wait in line, ensuring each receives a unique number.
    SELECT prefix, GREATEST(start_number, current_number + 1)
    INTO v_prefix, v_num
    FROM public.invoice_settings
    WHERE id = 'default'
    FOR UPDATE;

    LOOP
        -- Format example: CZP-01, CZP-02
        v_invoice_no := v_prefix || '-' || LPAD(v_num::TEXT, 2, '0');
        
        -- Check both active and soft-deleted orders to prevent overlap.
        SELECT EXISTS (SELECT 1 FROM public.orders WHERE invoice_no = v_invoice_no)
        INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        v_num := v_num + 1;
    END LOOP;

    -- Persist the incremented number.
    UPDATE public.invoice_settings
    SET current_number = v_num,
        updated_at = NOW()
    WHERE id = 'default';

    RETURN v_invoice_no;
END;
$function$;
