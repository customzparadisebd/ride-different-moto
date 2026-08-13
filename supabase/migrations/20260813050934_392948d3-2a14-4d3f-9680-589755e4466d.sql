-- REMOVE ALL COLORS EXCEPT BLACK FOR VISOR AND FACEMASK
DELETE FROM public.product_colors 
WHERE product_id IN (SELECT id FROM public.products WHERE name IN ('Visor', 'Facemask'))
AND name != 'Black';

-- ENSURE BLACK EXISTS FOR THEM
DO $$
DECLARE
    prod_id uuid;
BEGIN
    FOR prod_id IN SELECT id FROM public.products WHERE name IN ('Visor', 'Facemask')
    LOOP
        INSERT INTO public.product_colors (product_id, name, swatch, price_delta)
        VALUES (prod_id, 'Black', '#000000', 0)
        ON CONFLICT (product_id, name) DO UPDATE SET swatch = '#000000', price_delta = 0;
    END LOOP;
END $$;
