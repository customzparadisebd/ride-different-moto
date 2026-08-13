import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const logNotFound = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      path: z.string(),
      referrer: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data, request }) => {
    const userAgent = request.headers.get("user-agent");
    // Cloudflare specific header for IP if available
    const ipAddress = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");

    // Get current session for user_id
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("not_found_logs")
      .insert({
        path: data.path,
        referrer: data.referrer,
        user_agent: userAgent,
        ip_address: ipAddress,
        user_id: session?.user?.id || null,
      });

    if (error) {
      console.error("Failed to log 404:", error);
      return { success: false };
    }

    return { success: true };
  });
