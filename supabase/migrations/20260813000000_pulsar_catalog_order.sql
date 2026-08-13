-- N160/N250 PRODUCT ORDER & COLOR CONFIG — COMPLETED

-- Add sort_order to products for manual serial management
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- Reset and Update N160/N250 Product Serial Order
-- 1. X-3 KIT
UPDATE public.products SET sort_order = 1, price = 7000, offer_price = 6300, offer_enabled = true, badge_text = 'Pre-order · No Advance', badge_enabled = true WHERE name = 'X-3 Kit';
-- 2. KTM RC UNDERBELLY
UPDATE public.products SET sort_order = 2, price = 3300 WHERE name = 'KTM RC Underbelly';
-- 3. SIDE FAIRING
UPDATE public.products SET sort_order = 3, price = 5300 WHERE name = 'Side Fairing';
-- 4. KTM MUDGUARD
UPDATE public.products SET sort_order = 4, price = 1300 WHERE name = 'KTM Mudguard';
-- 5. TANK PAD
UPDATE public.products SET sort_order = 5, price = 2300 WHERE name = 'Tank Pad';
-- 6. SEAT COWL
UPDATE public.products SET sort_order = 6, price = 1700 WHERE name = 'Seat Cowl';
-- 7. FACEMASK
UPDATE public.products SET sort_order = 7, price = 1000 WHERE name = 'Facemask';
-- 8. VISOR
UPDATE public.products SET sort_order = 8, price = 1000 WHERE name = 'Visor';
-- 9. CZP DRL
UPDATE public.products SET sort_order = 9, name = 'CZP DRL', price = 2650, description = 'Mobile App & Bluetooth Controlled, 140+ Dynamic Colors, 1-year warranty' WHERE name = 'DRL — Indian CZP Brand';
-- 10. RING LIGHT — 60mm
UPDATE public.products SET sort_order = 10, name = 'Ring Light 60 mm', price = 150 WHERE name = 'Ring Light 60 mm';
-- 11. RING LIGHT — 170mm
UPDATE public.products SET sort_order = 11, name = 'Ring Light 170 mm', price = 170 WHERE name = 'Ring Light 170 mm';
-- 12. INDICATOR LIGHT + FLASHER COMBO
UPDATE public.products SET sort_order = 12, name = 'Indicator Light & Flasher Combo', price = 500 WHERE name = 'Indicator Light & Flasher Set';

-- Deactivate old demo products not in the serial
UPDATE public.products SET is_active = false WHERE name NOT IN ('X-3 Kit', 'KTM RC Underbelly', 'Side Fairing', 'KTM Mudguard', 'Tank Pad', 'Seat Cowl', 'Facemask', 'Visor', 'CZP DRL', 'Ring Light 60 mm', 'Ring Light 170 mm', 'Indicator Light & Flasher Combo');

-- COLOR SYSTEM ENFORCEMENT
-- Facemask & Visor: Black only (remove others)
DELETE FROM public.product_colors WHERE product_id IN (SELECT id FROM public.products WHERE name IN ('Facemask', 'Visor')) AND name != 'Black';
INSERT INTO public.product_colors (product_id, name, swatch, price_delta)
SELECT id, 'Black', '#000000', 0 FROM public.products WHERE name IN ('Facemask', 'Visor')
ON CONFLICT DO NOTHING;

-- Body Parts: Black, Red, Blue
DO $$
DECLARE
    prod_id uuid;
    part_name text;
BEGIN
    FOR part_name IN SELECT name FROM public.products WHERE name IN ('X-3 Kit', 'KTM RC Underbelly', 'Side Fairing', 'KTM Mudguard', 'Tank Pad', 'Seat Cowl')
    LOOP
        SELECT id INTO prod_id FROM public.products WHERE name = part_name;
        
        -- Ensure standard colors
        INSERT INTO public.product_colors (product_id, name, swatch, price_delta) VALUES
        (prod_id, 'Black', '#000000', 0),
        (prod_id, 'Red', '#FF0000', 300),
        (prod_id, 'Blue', '#0000FF', 600)
        ON CONFLICT DO NOTHING;
        
        -- Clean up colors not allowed
        IF part_name != 'X-3 Kit' THEN
            DELETE FROM public.product_colors WHERE product_id = prod_id AND name NOT IN ('Black', 'Red', 'Blue');
        END IF;
    END LOOP;
END $$;

-- Ring Lights: Blue, Red
DO $$
DECLARE
    prod_id uuid;
BEGIN
    FOR prod_id IN SELECT id FROM public.products WHERE name LIKE 'Ring Light%'
    LOOP
        DELETE FROM public.product_colors WHERE product_id = prod_id AND name NOT IN ('Red', 'Blue');
        INSERT INTO public.product_colors (product_id, name, swatch, price_delta) VALUES
        (prod_id, 'Red', '#FF0000', 0),
        (prod_id, 'Blue', '#0000FF', 0)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- DRL & Combo: No colors selectable
DELETE FROM public.product_colors WHERE product_id IN (SELECT id FROM public.products WHERE name IN ('CZP DRL', 'Indicator Light & Flasher Combo'));

