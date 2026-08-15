
CREATE TABLE IF NOT EXISTS public.steadfast_stats (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    successful_submissions_count BIGINT DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_order_id UUID REFERENCES public.orders(id),
    last_invoice_no TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.steadfast_stats TO authenticated;
GRANT ALL ON public.steadfast_stats TO service_role;

ALTER TABLE public.steadfast_stats ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_steadfast_count(order_id UUID, invoice_no TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.steadfast_stats (id, successful_submissions_count, last_success_at, last_order_id, last_invoice_no, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 1, NOW(), order_id, invoice_no, NOW())
    ON CONFLICT (id) DO UPDATE SET
        successful_submissions_count = steadfast_stats.successful_submissions_count + 1,
        last_success_at = EXCLUDED.last_success_at,
        last_order_id = EXCLUDED.last_order_id,
        last_invoice_no = EXCLUDED.last_invoice_no,
        updated_at = EXCLUDED.updated_at;
END;
$$;
