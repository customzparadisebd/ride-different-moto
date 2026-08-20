
-- We must grant EXECUTE to PUBLIC on these specific functions because 
-- they are used within RLS policies. When RLS executes, it does so as 
-- the user attempting the query (e.g., 'authenticated' or 'anon').
-- The 'permission denied' error occurs because we revoked public access.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text) TO PUBLIC;

-- Ensure schemas are accessible
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA private TO PUBLIC;

-- Re-verify owner for the record
COMMENT ON FUNCTION private.has_role IS 'Core security function for RLS. Must be executable by PUBLIC for RLS to work.';
