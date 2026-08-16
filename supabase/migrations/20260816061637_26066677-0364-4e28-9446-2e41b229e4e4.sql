-- Update Bike Models with specific high-quality optimized images
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=800&auto=format&fit=crop' WHERE name = 'Pulsar N160';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1449491026613-524dfa964507?q=80&w=800&auto=format&fit=crop' WHERE name = 'Pulsar NS200';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1622185135505-2d795003994a?q=80&w=800&auto=format&fit=crop' WHERE name = 'Pulsar N250';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1614165933396-7ed9780a4ec2?q=80&w=800&auto=format&fit=crop' WHERE name = 'Yamaha R15 V4';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=800&auto=format&fit=crop' WHERE name = 'MT-15';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=800&auto=format&fit=crop' WHERE name = 'Duke 250';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop' WHERE name = 'Yamaha R15 V3';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1614165933396-7ed9780a4ec2?q=80&w=800&auto=format&fit=crop' WHERE name = 'Yamaha R15';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop' WHERE name = 'Ninja 6R';
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1558981403-c5f91cbba523?q=80&w=800&auto=format&fit=crop' WHERE name IN ('Apache RTR', 'Apache 4V');
UPDATE public.bike_models SET image_url = 'https://images.unsplash.com/photo-1449491026613-524dfa964507?q=80&w=800&auto=format&fit=crop' WHERE name IN ('Gixxer Monotone', 'Gixxer FI ABS', 'Gixxer SF');

-- Update Products with relevant optimized part imagery
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop', images = '["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop"]'::jsonb WHERE name = 'X-3 Kit';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop', images = '["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop"]'::jsonb WHERE name = 'KTM RC Underbelly';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1621570275918-972fa27b9ca5?q=80&w=800&auto=format&fit=crop', images = '["https://images.unsplash.com/photo-1621570275918-972fa27b9ca5?q=80&w=800&auto=format&fit=crop"]'::jsonb WHERE name IN ('Side Fairing', 'KTM Mudguard', 'Seat Cowl');
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1621570275918-972fa27b9ca5?q=80&w=800&auto=format&fit=crop', images = '["https://images.unsplash.com/photo-1621570275918-972fa27b9ca5?q=80&w=800&auto=format&fit=crop"]'::jsonb WHERE name IN ('Tank Pad', 'Facemask', 'Visor');
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop', images = '["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop"]'::jsonb WHERE name IN ('CZP DRL', 'Ring Light 60 mm', 'Ring Light 170 mm', 'Indicator Light & Flasher Combo');
