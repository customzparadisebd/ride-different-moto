import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SiteLogo, LogoUpdateInput, LogoCategory } from "./logos.shared";

export async function getSiteLogos(): Promise<SiteLogo[]> {
  const { data, error } = await supabaseAdmin
    .from("site_logos")
    .select("*")
    .order("category");

  if (error) throw error;
  return data as SiteLogo[];
}

export async function updateSiteLogo(input: LogoUpdateInput) {
  const { category, ...updates } = input;
  
  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.url !== undefined) payload.url = updates.url;
  if (updates.storagePath !== undefined) payload.storage_path = updates.storagePath;
  if (updates.settings !== undefined) payload.settings = updates.settings;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const { data, error } = await supabaseAdmin
    .from("site_logos")
    .update(payload)
    .eq("category", category)
    .select()
    .single();

  if (error) throw error;
  return data as SiteLogo;
}


export async function uploadLogo(
  category: LogoCategory,
  fileDataBase64: string,
  fileName: string,
  contentType: string
) {
  const buffer = Buffer.from(fileDataBase64, 'base64');
  const path = `${category}/${Date.now()}-${fileName}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from("logos")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("logos")
    .getPublicUrl(path);

  return updateSiteLogo({
    category,
    url: publicUrl,
    storagePath: path,
  });
}

export async function resetLogoToDefault(category: LogoCategory) {
  const { data, error } = await supabaseAdmin
    .from("site_logos")
    .update({
      url: null,
      storage_path: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("category", category)
    .select()
    .single();

  if (error) throw error;
  return data as SiteLogo;
}
