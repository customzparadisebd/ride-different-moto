import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * INTERNAL USE ONLY: Stresses the invoice generation logic.
 * This function calls the `generate_next_invoice_no()` PL/pgSQL function
 * 10 times in parallel to verify concurrency safety.
 */
export const runInvoiceStressTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.securityManage,
    );
    
    console.log("Starting backend invoice stress test...");
    
    // We execute 10 calls to the database function simultaneously
    const tasks = Array.from({ length: 10 }).map(() => 
      supabaseAdmin.rpc('generate_next_invoice_no', { is_test: true })
    );
    
    const results = await Promise.all(tasks);
    
    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    const errors = results.map(r => r.error).filter(Boolean);
    
    const uniqueInvoices = new Set(invoices);
    const duplicates = invoices.length - uniqueInvoices.size;
    
    console.log("Stress test results:", {
      total: invoices.length,
      unique: uniqueInvoices.size,
      duplicates,
      errors: errors.length
    });

    return {
      success: duplicates === 0 && errors.length === 0 && invoices.length === 10,
      total: 10,
      unique: uniqueInvoices.size,
      duplicates,
      invoices: invoices.sort(),
      errors: errors.map(e => (e as any)?.message || "Unknown error")
    };
  });

/**
 * Simulate high traffic by fetching products and orders in parallel.
 */
export const runLoadTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.securityManage,
    );

    console.log("Starting load test...");
    const start = Date.now();
    
    // Simulate 20 parallel read requests
    const tasks = Array.from({ length: 20 }).map(async (_, i) => {
      const { data: products } = await supabaseAdmin.from('products').select('id, name').limit(10);
      const { data: orders } = await supabaseAdmin.from('orders').select('id, invoice_no').limit(10);
      return { 
        index: i, 
        products: products?.length || 0, 
        orders: orders?.length || 0 
      };
    });
    
    const results = await Promise.all(tasks);
    const duration = Date.now() - start;
    
    return {
      success: true,
      requests: 20,
      durationMs: duration,
      avgRequestMs: duration / 20,
      results
    };
  });
