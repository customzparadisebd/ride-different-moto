
-- Revoke from public first to be safe
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_permission(uuid, text) FROM PUBLIC;

-- Grant to authenticated and service_role specifically
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text) TO authenticated, service_role;

-- Ensure schema usage
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Final verification of search_path
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, private;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, private;
ALTER FUNCTION private.has_role(uuid, app_role) SET search_path = public, private;
ALTER FUNCTION private.has_permission(uuid, text) SET search_path = public, private;
