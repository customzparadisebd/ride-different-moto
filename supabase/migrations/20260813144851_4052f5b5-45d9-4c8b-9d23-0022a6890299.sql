-- Customer Fraud Marking System
-- Linked to phone number, not specific customer IDs or orders.

CREATE TABLE public.customer_fraud_marks (
    phone_number TEXT PRIMARY KEY,
    mark_type TEXT NOT NULL DEFAULT 'fraud', -- 'fraud', 'warning', etc.
    label TEXT, -- Optional short label/percentage as seen in reference
    note TEXT NOT NULL,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    marked_by UUID REFERENCES auth.users(id),
    marked_by_label TEXT, -- Display name of the admin
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_customer_fraud_phone ON public.customer_fraud_marks(phone_number);

-- RLS
ALTER TABLE public.customer_fraud_marks ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_fraud_marks TO authenticated;
GRANT ALL ON public.customer_fraud_marks TO service_role;

-- Policies (Restricted to Admins/Super Admins via has_role)
CREATE POLICY "Admins can manage fraud marks"
ON public.customer_fraud_marks
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

-- Also allow Staff/Managers to READ fraud marks
CREATE POLICY "Staff can view fraud marks"
ON public.customer_fraud_marks
FOR SELECT
TO authenticated
USING (true);
