CREATE OR REPLACE FUNCTION public.save_invoice_settings(
  p_prefix text,
  p_next_number integer DEFAULT NULL
)
RETURNS TABLE(prefix text, start_number integer, current_number integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text := upper(trim(p_prefix));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission(auth.uid(), 'orders.manage') THEN
    RAISE EXCEPTION 'Insufficient permission';
  END IF;

  IF v_prefix IS NULL OR length(v_prefix) < 1 OR length(v_prefix) > 20 THEN
    RAISE EXCEPTION 'Invalid invoice prefix';
  END IF;

  IF p_next_number IS NOT NULL AND (p_next_number < 1 OR p_next_number > 999999) THEN
    RAISE EXCEPTION 'Invalid next invoice number';
  END IF;

  UPDATE public.invoice_settings AS settings
  SET prefix = v_prefix,
      start_number = CASE
        WHEN p_next_number IS NULL THEN settings.start_number
        ELSE p_next_number
      END,
      current_number = CASE
        WHEN p_next_number IS NULL THEN settings.current_number
        ELSE p_next_number - 1
      END,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE settings.id = 'default'
  RETURNING settings.prefix, settings.start_number, settings.current_number
  INTO prefix, start_number, current_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice settings are not configured';
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.save_invoice_settings(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_invoice_settings(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_invoice_settings(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_invoice_settings(text, integer) TO service_role;