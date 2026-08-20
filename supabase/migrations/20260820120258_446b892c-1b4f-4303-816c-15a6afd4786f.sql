
-- Fix permission denied for has_role by ensuring proper schema usage and execution rights
-- The previous error suggests that even after granting to PUBLIC, the search_path 
-- or the schema usage for 'private' might still be restricted.

GRANT USAGE ON SCHEMA private TO authenticated, service_role, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role, anon;

-- Explicitly for has_role to be safe
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text) TO authenticated, service_role, anon;

-- Ensure public wrappers can see private schema
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, private;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, private;

-- Double check user_roles table grants as well
GRANT SELECT ON public.user_roles TO authenticated, service_role;
