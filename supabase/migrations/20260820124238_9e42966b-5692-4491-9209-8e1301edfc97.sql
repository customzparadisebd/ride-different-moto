-- Revoke EXECUTE from public to secure the SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM PUBLIC;

-- Grant EXECUTE to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO service_role;