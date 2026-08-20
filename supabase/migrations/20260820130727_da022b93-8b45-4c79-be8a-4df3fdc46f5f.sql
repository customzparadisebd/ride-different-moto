-- Revoke EXECUTE from PUBLIC, anon, and authenticated
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() FROM authenticated;

-- Grant to service_role (for triggers and backend use)
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() TO service_role;

-- Special case: We might need managers/admins to be able to call it if some functions use context.supabase
-- However, since orders are created via createServerFn which uses supabaseAdmin (service_role), 
-- keeping it service_role only is safer.
-- If the UI needs to show the "Next Number", it uses getInvoiceSettings serverFn which runs as service_role.
