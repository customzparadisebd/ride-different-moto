
-- Granting EXECUTE permissions explicitly to ensure accessibility
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text) TO authenticated, service_role;

-- Ensure the search_path includes both schemas for the functions
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, private;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, private;
ALTER FUNCTION private.has_role(uuid, app_role) SET search_path = public, private;
ALTER FUNCTION private.has_permission(uuid, text) SET search_path = public, private;
