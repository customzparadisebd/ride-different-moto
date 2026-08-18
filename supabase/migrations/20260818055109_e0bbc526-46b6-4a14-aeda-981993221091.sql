ALTER TABLE public.section_settings ADD COLUMN IF NOT EXISTS product_category TEXT;
COMMENT ON COLUMN public.section_settings.product_category IS 'Optional category filter for the homepage section';