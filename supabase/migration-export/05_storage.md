# 05 — Storage buckets (verified against source code)

SQL exports do not carry Storage buckets or files. Recreate them by hand in the
new project, copy the objects, then rewrite the absolute URLs stored in the
database.

## 1. Buckets the code actually uses

Every bucket name below was found in the source, not assumed.

| Bucket         | Public? | Where it is used                                                                                | Exists in the old project? |
| -------------- | ------- | ----------------------------------------------------------------------------------------------- | -------------------------- |
| `avatars`      | **No**  | `src/lib/avatar.ts` (`AVATAR_BUCKET`) — staff profile pictures, read through signed URLs         | Yes (1 object)             |
| `logos`        | **No**  | `src/lib/logos.server.ts` — logo variants for Admin → Settings → Logos, read through signed URLs | Yes (0 objects)            |
| `products`     | **Yes** | `SingleImageUpload` default bucket, `products/ProductImageUpload.tsx`, `hero-upload.functions.ts` (`hero/*` paths), Gallery + Bike Models panels | **No — must create**       |
| `hero`         | **Yes** | `SingleImageUpload bucket="hero"` in `routes/_authenticated/ad/hero.tsx` (bike card images)      | **No — must create**       |
| `hero-banners` | **Yes** | `src/routes/api/hero/upload.ts`                                                                  | **No — must create**       |
| `bike-models`  | **Yes** | No upload code, but 14 `bike_models.image_url` rows in `02_data.sql` point at it                 | **No — must create**       |

Important: `products`, `hero`, `hero-banners` and `bike-models` do **not** exist
in the current project, so those upload paths and 32 stored image URLs are
already broken today. Creating the four buckets in the new project fixes the
upload paths; the images themselves have to be re-uploaded (see §4).

Buckets that call `getPublicUrl()` (`products`, `hero`, `hero-banners`,
`bike-models`) must be created with **Public bucket = ON**, otherwise the stored
`/object/public/...` URLs return 400. `avatars` and `logos` must stay private —
the app signs those URLs server-side.

## 2. RLS policies on `storage.objects`

These are the policies that exist in the current project, transcribed exactly.
Run them after creating the buckets:

```sql
-- avatars (private): user-owned folders, staff-wide read
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Staff can read avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND public.is_staff(auth.uid()));

-- logos (private): public read of objects, admin-only writes
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- hero-banners (public bucket)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT USING (bucket_id = 'hero-banners');

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hero-banners' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hero-banners' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
```

The current project has **no** policies for `products`, `hero` or `bike-models`.
Client-side uploads from `SingleImageUpload` / `ProductImageUpload` use the
browser client, so they need policies — add these (they did not exist before,
which is why those uploads failed):

```sql
CREATE POLICY "Public read media buckets"
ON storage.objects FOR SELECT
USING (bucket_id IN ('products', 'hero', 'bike-models'));

CREATE POLICY "Staff write media buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('products', 'hero', 'bike-models') AND public.is_staff(auth.uid()));

CREATE POLICY "Staff update media buckets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('products', 'hero', 'bike-models') AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id IN ('products', 'hero', 'bike-models') AND public.is_staff(auth.uid()));

CREATE POLICY "Staff delete media buckets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('products', 'hero', 'bike-models') AND public.is_staff(auth.uid()));
```

Server-side code that uses the service-role key bypasses all of these by design
(that is how signed URLs and hero uploads are produced).

## 3. File paths the database expects

| Bucket         | Path shape                           | Written by                                  |
| -------------- | ------------------------------------ | ------------------------------------------- |
| `avatars`      | `<user-uuid>/<random>.jpg`           | avatar upload (folder must equal the UUID)  |
| `logos`        | `<category>/<file>`                  | `logos.server.ts`                           |
| `products`     | `<pathPrefix>/<random>.<ext>` and `hero/<desktop\|mobile>/<file>` | `SingleImageUpload`, `hero-upload.functions.ts` |
| `hero`         | `bikes/<random>.<ext>`               | Bike Models panel                           |
| `hero-banners` | `<random>.<ext>`                     | `api/hero/upload.ts`                        |
| `bike-models`  | `<slug>.jpg`                         | legacy/manual uploads                       |

Keep paths byte-identical when copying — the database stores them.

## 4. Copy the files

Only one object exists in the old project (`avatars/5778eed7-…/0.86096…jpg`).
Everything else referenced by the database was already missing, so plan to
re-upload from your own originals through the admin panel.

```bash
supabase storage cp -r ss:///avatars ./backup/avatars --project-ref <OLD_REF>
supabase storage cp -r ss:///logos   ./backup/logos   --project-ref <OLD_REF>

supabase storage cp -r ./backup/avatars ss:///avatars --project-ref <NEW_REF>
supabase storage cp -r ./backup/logos   ss:///logos   --project-ref <NEW_REF>
```

## 5. Rewrite absolute URLs that embed the old project ref

Old ref: `pqphihorljepzfdacant`. Counts in `02_data.sql`: `products` 15,
`bike-models` 14, `hero-banners` 3, `avatars` 1.

```sql
UPDATE public.profiles          SET avatar_url = replace(avatar_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE avatar_url LIKE '%supabase.co%';
UPDATE public.site_logos        SET url = replace(url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE url LIKE '%supabase.co%';
UPDATE public.products          SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE image_url LIKE '%supabase.co%';
UPDATE public.product_colors    SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE image_url LIKE '%supabase.co%';
UPDATE public.product_360_images SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE image_url LIKE '%supabase.co%';
UPDATE public.gallery_items     SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE image_url LIKE '%supabase.co%';
UPDATE public.bike_models       SET image_url = replace(image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co') WHERE image_url LIKE '%supabase.co%';
UPDATE public.hero_slides
SET image_url        = replace(image_url,        '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co'),
    mobile_image_url = replace(mobile_image_url, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')
WHERE image_url LIKE '%supabase.co%' OR mobile_image_url LIKE '%supabase.co%';

-- products.images is JSONB; rewrite it as text
UPDATE public.products
SET images = replace(images::text, '<OLD_REF>.supabase.co', '<NEW_REF>.supabase.co')::jsonb
WHERE images::text LIKE '%supabase.co%';
```

Images imported from `src/assets` are bundled into the build and need no action.

## 6. Verify

- Admin → Settings → Logos shows every logo variant.
- Uploading a product image, a bike card image and a hero banner all succeed.
- Homepage hero, gallery, bike models and product images render.
- No 400/404 from `storage/v1/object` in the browser console.
