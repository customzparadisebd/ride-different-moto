DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_invoice_no_key'
    ) THEN
        -- We apply this to the orders table.
        -- Note: If there are existing duplicates, this will fail and require manual cleanup.
        ALTER TABLE public.orders ADD CONSTRAINT orders_invoice_no_key UNIQUE (invoice_no);
    END IF;
END $$;

-- Verify/Refresh the unique index for soft-deleted rows
DROP INDEX IF EXISTS public.orders_invoice_no_uidx;
CREATE UNIQUE INDEX orders_invoice_no_uidx ON public.orders(invoice_no) WHERE deleted_at IS NULL;
