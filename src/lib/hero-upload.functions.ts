import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const uploadHeroBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: any) => d)
  .handler(async ({ data: formData, context }) => {
    const ctx = context as any;
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(ctx.userId, ctx.claims as never);
    
    // SECURITY: Only Admin/Super Admin can upload banners
    assertAccess(actor, PERMISSIONS.contentManage);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) throw new Error("No file uploaded");
    
    // SECURITY: Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPG, PNG, and WebP are allowed.");
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      throw new Error("File too large. Maximum size is 2MB.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${file.type.split("/")[1]}`;
    const filePath = `hero/${type}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("products")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage.from("products").getPublicUrl(filePath);

    return { url: publicUrl };
  });
