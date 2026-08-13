-- Add gender and avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- RLS for avatars bucket
-- Allow authenticated users to upload to their own folder
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatars') THEN
        CREATE POLICY "Users can upload their own avatars"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read of avatars') THEN
        CREATE POLICY "Public read of avatars"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatars') THEN
        CREATE POLICY "Users can delete their own avatars"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END
$$;

-- Ensure authenticated users can update their own profile fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

GRANT UPDATE (gender, avatar_url, full_name) ON public.profiles TO authenticated;
