ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS delete_reason TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
CREATE POLICY "Admins can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
CREATE POLICY "Staff can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'staff') OR
    public.has_role(auth.uid(), 'manager')
);