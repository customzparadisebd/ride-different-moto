# 05 — Storage buckets

The database export does not carry Storage buckets or files. Recreate them by
hand in the new Supabase project, then copy the objects and rewrite the URLs.

## 1. Buckets to create

| Bucket    | Public? | Used for                                               |
| --------- | ------- | ------------------------------------------------------ |
| `avatars` | No      | Admin/staff profile pictures (served via signed URLs)  |
| `logos`   | No      | Site logo variants managed from Admin → Settings → Logos |

Create both in **Storage → New bucket** with *Public bucket* left OFF. The app
reads these through signed URLs, so making them public is unnecessary and
weakens access control.

## 2. RLS policies on `storage.objects`

Run this in the SQL editor after creating the buckets:

```sql
-- Staff may manage both buckets; nobody else gets direct object access.
CREATE POLICY "staff read app buckets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('avatars', 'logos') AND public.is_staff(auth.uid()));

CREATE POLICY "staff upload app buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('avatars', 'logos') AND public.is_staff(auth.uid()));

CREATE POLICY "staff update app buckets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('avatars', 'logos') AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id IN ('avatars', 'logos') AND public.is_staff(auth.uid()));

CREATE POLICY "staff delete app buckets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('avatars', 'logos') AND public.is_staff(auth.uid()));
```

Server-side code uses the service-role key, which bypasses these policies —
that is intentional and how signed URLs are produced.

## 3. Copy the files

Download from the old project (Storage → bucket → select all → Download), then
upload into the identically named bucket on the new project. With the Supabase
CLI:

```bash
supabase storage cp -r ss:///avatars ./backup/avatars --project-ref <OLD_REF>
supabase storage cp -r ss:///logos   ./backup/logos   --project-ref <OLD_REF>

supabase storage cp -r ./backup/avatars ss:///avatars --project-ref <NEW_REF>
supabase storage cp -r ./backup/logos   ss:///logos   --project-ref <NEW_REF>
```

Keep the object paths byte-identical — the database stores those paths.

## 4. Rewrite absolute URLs that embed the old project ref

```sql
UPDATE public.profiles
SET avatar_url = replace(avatar_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE avatar_url LIKE '%supabase.co%';

UPDATE public.site_logos
SET url = replace(url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE url LIKE '%supabase.co%';

UPDATE public.products
SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%';

UPDATE public.product_colors
SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%';

UPDATE public.hero_slides
SET image_url        = replace(image_url,        '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co'),
    mobile_image_url = replace(mobile_image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%' OR mobile_image_url LIKE '%supabase.co%';

UPDATE public.gallery_items
SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%';

UPDATE public.product_360_images
SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%';

UPDATE public.bike_models
SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%';
```

Images imported from `src/assets` are bundled into the build and need no action.

## 5. Verify

- Admin → Settings → Logos shows every logo variant.
- An admin avatar renders in the top bar; upload a new one successfully.
- Homepage hero slides, gallery, bike models and product images all load.
- Browser console shows no 400/404 from `storage/v1/object`.
