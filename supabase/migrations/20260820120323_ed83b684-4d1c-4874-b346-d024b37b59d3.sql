
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role, anon;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role, anon;

-- Ensure role table itself is readable for the check
GRANT SELECT ON public.user_roles TO authenticated, service_role, anon;
