-- Migration to create the gallery_items table and its RLS policies

-- 1. Create the table
CREATE TABLE public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Grant Data API access
GRANT SELECT ON public.gallery_items TO authenticated, anon;
GRANT ALL ON public.gallery_items TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;

-- 3. Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Anyone can view active gallery items"
ON public.gallery_items
FOR SELECT
TO public
USING (is_active = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Staff can manage gallery items"
ON public.gallery_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- 5. Trigger for updated_at
CREATE TRIGGER tr_gallery_items_updated_at
    BEFORE UPDATE ON public.gallery_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
