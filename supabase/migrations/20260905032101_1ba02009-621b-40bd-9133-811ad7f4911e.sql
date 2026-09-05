CREATE TEMP TABLE url_map(old_url text primary key, new_url text) ON COMMIT DROP;
INSERT INTO url_map VALUES
 ('https://i.ibb.co.com/35jMsJQs/9.webp','/media/9.webp'),
 ('https://i.ibb.co.com/3m75zCR5/27.webp','/media/27.webp'),
 ('https://i.ibb.co.com/3yxrZcHF/8.webp','/media/8.webp'),
 ('https://i.ibb.co.com/4QQ3Wrf/19-1.webp','/media/19-1.webp'),
 ('https://i.ibb.co.com/5XR35Rmb/28.webp','/media/28.webp'),
 ('https://i.ibb.co.com/60xkR7Kd/2.webp','/media/2.webp'),
 ('https://i.ibb.co.com/7xns8qZJ/Whats-App-Image-2026-08-08-at-10-07-33-PM-1.webp','/media/Whats-App-Image-2026-08-08-at-10-07-33-PM-1.webp'),
 ('https://i.ibb.co.com/C3D98brs/15.webp','/media/15.webp'),
 ('https://i.ibb.co.com/cSJ1gzJd/1.webp','/media/1.webp'),
 ('https://i.ibb.co.com/DD8yNzbq/10.webp','/media/10.webp'),
 ('https://i.ibb.co.com/DDLKqq0b/4.webp','/media/4.webp'),
 ('https://i.ibb.co.com/DfXzFQ9N/3.webp','/media/3.webp'),
 ('https://i.ibb.co.com/dsyTnMhX/16.webp','/media/16.webp'),
 ('https://i.ibb.co.com/DTDGb0T/29.webp','/media/29.webp'),
 ('https://i.ibb.co.com/hJtcVXP2/12.webp','/media/12.webp'),
 ('https://i.ibb.co.com/hRTLZkvr/14.webp','/media/14.webp'),
 ('https://i.ibb.co.com/j9fVLdF2/23.webp','/media/23.webp'),
 ('https://i.ibb.co.com/jk56pHHd/26.webp','/media/26.webp'),
 ('https://i.ibb.co.com/KxmhvLGm/22.webp','/media/22.webp'),
 ('https://i.ibb.co.com/NdfBcqzs/5.webp','/media/5.webp'),
 ('https://i.ibb.co.com/Ng6t8Jm2/21.webp','/media/21.webp'),
 ('https://i.ibb.co.com/nq3ZyvG2/17.webp','/media/17.webp'),
 ('https://i.ibb.co.com/Pv9qTLM2/25.webp','/media/25.webp'),
 ('https://i.ibb.co.com/r21SynrJ/13.webp','/media/13.webp'),
 ('https://i.ibb.co.com/S4JPsKby/18-1.webp','/media/18-1.webp'),
 ('https://i.ibb.co.com/s9QQbSYm/11.webp','/media/11.webp'),
 ('https://i.ibb.co.com/TDhMYVjv/7.webp','/media/7.webp'),
 ('https://i.ibb.co.com/xSHtWmLw/Untitled-design-8.webp','/media/Untitled-design-8.webp'),
 ('https://i.ibb.co.com/yc6Bdhgq/20-1.webp','/media/20-1.webp'),
 ('https://i.ibb.co.com/Z60WFM57/6.webp','/media/6.webp'),
 ('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop','/media/unsplash-1605559424843.jpg'),
 ('https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-duke-250.jpg','/media/hero-duke-250.jpg'),
 ('https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-pulsar-n160.jpg','/media/hero-pulsar-n160.jpg'),
 ('https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/hero-banners/hero-r15-v4.jpg','/media/hero-r15-v4.jpg'),
 ('https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/bike-models/mt15.jpg','/media/mt15.jpg'),
 ('https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/bike-models/ns200.jpg','/media/ns200.jpg'),
 ('https://pqphihorljepzfdacant.supabase.co/storage/v1/object/public/bike-models/pulsar-n250.jpg','/media/pulsar-n250.jpg');

UPDATE public.products p SET image_url = m.new_url FROM url_map m WHERE p.image_url = m.old_url;
UPDATE public.product_colors c SET image_url = m.new_url FROM url_map m WHERE c.image_url = m.old_url;
UPDATE public.product_360_images i SET image_url = m.new_url FROM url_map m WHERE i.image_url = m.old_url;
UPDATE public.gallery_items g SET image_url = m.new_url FROM url_map m WHERE g.image_url = m.old_url;
UPDATE public.bike_models b SET image_url = m.new_url FROM url_map m WHERE b.image_url = m.old_url;
UPDATE public.order_items o SET image_url = m.new_url FROM url_map m WHERE o.image_url = m.old_url;
UPDATE public.hero_slides h SET image_url = m.new_url FROM url_map m WHERE h.image_url = m.old_url;
UPDATE public.hero_slides h SET mobile_image_url = m.new_url FROM url_map m WHERE h.mobile_image_url = m.old_url;

UPDATE public.products p
SET images = (
  SELECT jsonb_agg(COALESCE(m2.new_url, elem #>> '{}'))
  FROM jsonb_array_elements(p.images) AS elem
  LEFT JOIN url_map m2 ON m2.old_url = elem #>> '{}'
)
WHERE jsonb_typeof(p.images) = 'array'
  AND jsonb_array_length(p.images) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p.images) e JOIN url_map m3 ON m3.old_url = e #>> '{}'
  );