import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

export const verifyDatabaseSecurity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    const actor = await resolveActor(context.userId, context.claims as never);
    assertAccess(actor, PERMISSIONS.apiManage);

    const results = [];
    const tables = ["orders", "products", "profiles", "courier_credentials", "admin_audit_log"];

    // 1. Verify Service Role bypass (Internal use)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table as never).select("id" as never).limit(1);
      results.push({
        table,
        role: "service_role",
        action: "SELECT",
        success: !error,
        error: error?.message || null,
      });
    }

    // 2. Verify Anon access (should be blocked for most, allowed for products)
    const { createClient } = await import("@supabase/supabase-js");
    const anonKey = process.env["SUPABASE_ANON_KEY"]!;
    const supabaseUrl = process.env["SUPABASE_URL"]!;
    const anonClient = createClient(supabaseUrl, anonKey);

    for (const table of tables) {
      const { error } = await anonClient.from(table as never).select("id" as never).limit(1);
      const isProductTable = table === "products";
      const expectedBlocked = !isProductTable;
      
      results.push({
        table,
        role: "anon",
        action: "SELECT",
        success: expectedBlocked ? !!error : !error,
        error: error?.message || null,
        status: expectedBlocked && error ? "SECURE" : (!expectedBlocked && !error ? "OK" : "VULNERABLE"),
      });
    }

    return { results, timestamp: new Date().toISOString() };
  });
