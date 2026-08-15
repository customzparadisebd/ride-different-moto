import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * INTERNAL USE ONLY: Stresses the invoice generation logic.
 * This function calls the `generate_next_invoice_no()` PL/pgSQL function
 * 10 times in parallel to verify concurrency safety.
 */
export const runInvoiceStressTest = createServerFn({ method: "POST" })
  .handler(async () => {
    console.log("Starting backend invoice stress test...");
    
    // We execute 10 calls to the database function simultaneously
    const tasks = Array.from({ length: 10 }).map(() => 
      supabaseAdmin.rpc('generate_next_invoice_no')
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
