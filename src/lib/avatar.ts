import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";
const LEGACY_PUBLIC_MARKER = "/storage/v1/object/public/avatars/";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Resolves a stored avatar value to a bucket-relative object path.
 * Returns null for external preset avatars (dicebear etc.), which need no signing.
 */
export function toAvatarObjectPath(value?: string | null): string | null {
  if (!value) return null;

  const markerAt = value.indexOf(LEGACY_PUBLIC_MARKER);
  if (markerAt !== -1) {
    const raw = value.slice(markerAt + LEGACY_PUBLIC_MARKER.length).split("?")[0] ?? "";
    return raw ? decodeURIComponent(raw) : null;
  }

  if (/^(https?:|data:|blob:)/i.test(value)) return null;

  return value.replace(/^\/?avatars\//, "").replace(/^\/+/, "") || null;
}

/**
 * Returns a displayable avatar src. Private-bucket objects are exchanged for a
 * short-lived signed URL; external preset URLs pass through unchanged.
 */
export function useAvatarSrc(value?: string | null): string | null {
  const [src, setSrc] = useState<string | null>(() =>
    toAvatarObjectPath(value) ? null : (value ?? null),
  );

  useEffect(() => {
    const path = toAvatarObjectPath(value);

    if (!path) {
      setSrc(value ?? null);
      return;
    }

    let active = true;
    setSrc(null);

    void supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
      .then(({ data }) => {
        if (active) setSrc(data?.signedUrl ?? null);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => {
      active = false;
    };
  }, [value]);

  return src;
}
