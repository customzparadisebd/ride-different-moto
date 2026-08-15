-- Add video fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_platform TEXT CHECK (video_platform IN ('youtube', 'facebook', 'instagram', 'tiktok')),
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Refresh schema cache and ensure grants (though public usually has it, standardizing)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
