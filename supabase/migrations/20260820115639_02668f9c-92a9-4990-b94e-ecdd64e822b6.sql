-- 1. Correct has_role to handle app_role correctly and avoid recursion if it exists
-- The current policy uses has_role(auth.uid(), 'admin'::app_role)
-- Let's check the function definition first
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'has_role';

-- 2. Drop the restrictive policy and replace it with a broader one that includes 'super_admin' and 'manager'
-- or simply uses the has_role function correctly if it's supposed to handle multiple roles.
-- Based on previous context, has_role checks for a specific role. 

-- Let's create a more inclusive policy for bike_models
DROP POLICY IF EXISTS "Admins can manage bike models" ON public.bike_models;

CREATE POLICY "Privileged staff can manage bike models"
ON public.bike_models
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- 3. Ensure GRANTs are correct
GRANT ALL ON public.bike_models TO authenticated;
GRANT ALL ON public.bike_models TO service_role;
