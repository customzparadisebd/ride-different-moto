-- Secure the has_role function by revoking public execute and granting only to authenticated/service_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- We already updated the policy, but let's re-verify the bike_models table is correct
-- The linter warning 0029 is about SECURITY DEFINER functions being executable by anyone.
-- We keep it SECURITY DEFINER to avoid recursion but restrict who can call it.
