-- FLASH SALE SYSTEM MIGRATION
-- Purpose: Admin-controlled scheduling, product selection, and pricing for limited-time offers.
-- Status: INITIAL

CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE public.flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    discount_type public.discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
    is_active BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.flash_sale_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_sale_id UUID REFERENCES public.flash_sales(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(flash_sale_id, product_id)
);

-- RLS & GRANTS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.flash_sales TO authenticated, anon;
GRANT SELECT ON public.flash_sale_products TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.flash_sales TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.flash_sale_products TO authenticated;
GRANT ALL ON public.flash_sales TO service_role;
GRANT ALL ON public.flash_sale_products TO service_role;

-- Policies
CREATE POLICY "Public can view active flash sales" ON public.flash_sales
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Staff can manage flash sales" ON public.flash_sales
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public can view flash sale products" ON public.flash_sale_products
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.flash_sales fs WHERE fs.id = flash_sale_id AND (fs.is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "Staff can manage flash sale products" ON public.flash_sale_products
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Search Path Safety
ALTER FUNCTION public.has_role SET search_path = public;
