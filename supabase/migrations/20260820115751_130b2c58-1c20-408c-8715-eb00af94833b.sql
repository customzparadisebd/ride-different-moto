-- Correcting the revoke/grant statements with exact argument types
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_invoice_no() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_steadfast_count(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.alert_on_invoice_collision() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.next_invoice_no() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_steadfast_count(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.alert_on_invoice_collision() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() TO service_role;
