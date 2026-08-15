
-- Add stock out toggle to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS out_of_stock_toggle BOOLEAN DEFAULT false;

-- Track stock deductions to prevent duplicates
CREATE TABLE IF NOT EXISTS public.order_stock_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    deducted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(order_item_id)
);

GRANT SELECT, INSERT ON public.order_stock_deductions TO authenticated;
GRANT ALL ON public.order_stock_deductions TO service_role;
ALTER TABLE public.order_stock_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can see deductions" ON public.order_stock_deductions
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Track returns
CREATE TABLE IF NOT EXISTS public.order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    processed_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.order_returns TO authenticated;
GRANT ALL ON public.order_returns TO service_role;
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can see returns" ON public.order_returns
    FOR SELECT TO authenticated USING (true);

-- Track damages
CREATE TABLE IF NOT EXISTS public.order_damages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    processed_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.order_damages TO authenticated;
GRANT ALL ON public.order_damages TO service_role;
ALTER TABLE public.order_damages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can see damages" ON public.order_damages
    FOR SELECT TO authenticated USING (true);
