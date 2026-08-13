-- COLOR SYSTEM REFINEMENT: BLACK, RED, BLUE ONLY
-- 1. Handle duplicates before adding the constraint
DELETE FROM public.product_colors a
USING public.product_colors b
WHERE a.id < b.id 
  AND a.product_id = b.product_id 
  AND a.name = b.name;

-- 2. Add the unique constraint
ALTER TABLE public.product_colors ADD CONSTRAINT product_colors_product_id_name_key UNIQUE (product_id, name);

-- 3. Remove any colors that are not Black, Red, or Blue
DELETE FROM public.product_colors 
WHERE name NOT IN ('Black', 'Red', 'Blue');

-- 4. Reset and refine color selection for all relevant products
DO $$
DECLARE
    prod_record RECORD;
BEGIN
    FOR prod_record IN 
        SELECT id, name FROM public.products 
        WHERE is_active = true 
        AND name NOT IN ('CZP DRL', 'Indicator Light & Flasher Combo')
    LOOP
        -- Black (Order 1)
        INSERT INTO public.product_colors (product_id, name, swatch, price_delta) 
        VALUES (prod_record.id, 'Black', '#000000', 0)
        ON CONFLICT (product_id, name) DO UPDATE SET swatch = '#000000', price_delta = 0;
        
        -- Red (Order 2)
        INSERT INTO public.product_colors (product_id, name, swatch, price_delta) 
        VALUES (prod_record.id, 'Red', '#FF0000', CASE WHEN prod_record.name LIKE 'Ring Light%' OR prod_record.name IN ('Facemask', 'Visor') THEN 0 ELSE 300 END)
        ON CONFLICT (product_id, name) DO UPDATE SET swatch = '#FF0000';
        
        -- Blue (Order 3)
        INSERT INTO public.product_colors (product_id, name, swatch, price_delta) 
        VALUES (prod_record.id, 'Blue', '#0000FF', CASE WHEN prod_record.name LIKE 'Ring Light%' OR prod_record.name IN ('Facemask', 'Visor') THEN 0 ELSE 600 END)
        ON CONFLICT (product_id, name) DO UPDATE SET swatch = '#0000FF';
    END LOOP;
END $$;
