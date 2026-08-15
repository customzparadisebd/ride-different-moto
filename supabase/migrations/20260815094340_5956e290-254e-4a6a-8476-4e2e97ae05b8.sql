-- MIGRATION: 360 Degree Product Viewer
-- Purpose: Adds support for 360° image sequences for products.

-- 1. Add toggle to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS has_360_view BOOLEAN DEFAULT FALSE;

-- 2. Create table for 360° images
CREATE TABLE IF NOT EXISTS public.product_360_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.product_360_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Anyone can view 360 images" 
ON public.product_360_images FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admins can manage 360 images" 
ON public.product_360_images FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. Grants
GRANT SELECT ON public.product_360_images TO anon;
GRANT ALL ON public.product_360_images TO authenticated;
GRANT ALL ON public.product_360_images TO service_role;
