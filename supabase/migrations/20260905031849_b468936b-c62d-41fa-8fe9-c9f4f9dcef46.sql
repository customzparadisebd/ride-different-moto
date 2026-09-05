UPDATE public.products
SET image_url = '/products/' || regexp_replace(image_url, '^.*/', '')
WHERE image_url LIKE '/__l5e/%';

UPDATE public.products
SET images = replace(images::text, '/__l5e/assets-v1/0d7182f0-470c-4d70-9cf7-cd92d0508ef7/', '/products/')::jsonb
WHERE images::text LIKE '%/__l5e/%';

UPDATE public.products
SET images = (
  SELECT jsonb_agg(
    CASE WHEN elem #>> '{}' LIKE '/__l5e/%'
      THEN to_jsonb('/products/' || regexp_replace(elem #>> '{}', '^.*/', ''))
      ELSE elem END
  )
  FROM jsonb_array_elements(products.images) AS elem
)
WHERE jsonb_typeof(images) = 'array' AND images::text LIKE '%/__l5e/%';

UPDATE public.order_items
SET image_url = '/products/' || regexp_replace(image_url, '^.*/', '')
WHERE image_url LIKE '/__l5e/%';