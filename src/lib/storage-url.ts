/**
 * Hosting-independent public URLs for Supabase Storage objects.
 *
 * Uploaded media is referenced through a same-origin path served by this app
 * (`/api/public/media/<bucket>/<path>`) instead of an absolute Supabase URL.
 * That keeps stored URLs valid when the project moves between hosting
 * environments or Supabase projects, and it works whether the bucket is
 * public or private.
 */

/** Buckets that may be served publicly through the media route. */
export const PUBLIC_MEDIA_BUCKETS = [
  "products",
  "bike-models",
  "hero",
  "hero-banners",
  "logos",
] as const;

export type PublicMediaBucket = (typeof PUBLIC_MEDIA_BUCKETS)[number];

export function isPublicMediaBucket(bucket: string): bucket is PublicMediaBucket {
  return (PUBLIC_MEDIA_BUCKETS as readonly string[]).includes(bucket);
}

/** Build the app-relative URL for a storage object. */
export function storageMediaUrl(bucket: string, path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `/api/public/media/${bucket}/${clean}`;
}
