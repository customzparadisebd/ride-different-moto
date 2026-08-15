-- DATA REPLAY (SKELETON)
-- Execute in order to satisfy foreign keys

-- 1. Brands
-- INSERT INTO public.brands (id, name, slug, ...) VALUES (...);

-- 2. Categories
-- INSERT INTO public.categories (id, name, slug, ...) VALUES (...);

-- 3. Suppliers
-- INSERT INTO public.suppliers (id, name, ...) VALUES (...);

-- 4. Products
-- INSERT INTO public.products (id, brand_id, category_id, name, ...) VALUES (...);

-- 5. Product Colors
-- INSERT INTO public.product_colors (id, product_id, name, ...) VALUES (...);

-- 6. Cities & Zones
-- INSERT INTO public.cities (id, name, ...) VALUES (...);

-- 7. Invoice Settings
INSERT INTO public.invoice_settings (id, prefix, start_number, current_number, updated_at) 
VALUES ('default', 'CZP', 1, 4, now())
ON CONFLICT (id) DO UPDATE SET current_number = EXCLUDED.current_number;
