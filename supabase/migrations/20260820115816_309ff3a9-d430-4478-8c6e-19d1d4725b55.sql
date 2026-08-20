-- Revoke from the last one we missed in the previous batch
REVOKE EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() TO service_role;

-- The RLS issue for bike_models was likely because managers/super_admins weren't included in the policy.
-- Re-confirming the policy for bike_models one more time to be absolutely sure.
DROP POLICY IF EXISTS "Privileged staff can manage bike models" ON public.bike_models;
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
