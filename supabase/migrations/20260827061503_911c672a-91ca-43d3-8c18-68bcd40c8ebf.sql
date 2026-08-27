REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO service_role;