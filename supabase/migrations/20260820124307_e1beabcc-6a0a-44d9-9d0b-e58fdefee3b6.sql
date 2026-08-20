-- Revoke and Grant for both versions to be safe
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO service_role;

GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no() TO service_role;