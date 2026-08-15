import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Manual client for test environment to bypass start context
const testSupabase = createClient(
  process.env['VITE_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

describe('Invoice Concurrency Uniqueness', () => {
  it('should generate unique invoice serials under parallel load', async () => {
    // Load counts from environment variables with safe defaults
    const concurrency = parseInt(process.env['TEST_INVOICE_CONCURRENCY'] || '10');
    const totalOrders = parseInt(process.env['TEST_INVOICE_TOTAL'] || concurrency.toString());
    
    console.log(`Running concurrency test: ${concurrency} parallel tasks for ${totalOrders} total invoices`);

    // Execute calls to the database function
    const tasks = Array.from({ length: totalOrders }).map(() => 
      testSupabase.rpc('generate_next_invoice_no', { is_test: true })
    );
    
    const results = await Promise.all(tasks);
    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    const errors = results.map(r => r.error).filter(Boolean);
    
    expect(errors.length).toBe(0);
    expect(invoices.length).toBe(totalOrders);
    
    const uniqueInvoices = new Set(invoices);
    expect(uniqueInvoices.size).toBe(totalOrders);
    
    // Sequence Continuity Verification
    const sorted = [...invoices].sort((a, b) => {
      const numA = parseInt(a.split('-').pop() || '0');
      const numB = parseInt(b.split('-').pop() || '0');
      return numA - numB;
    });

    console.log(`Verifying continuity for ${sorted.length} invoices: ${sorted[0]} to ${sorted[sorted.length - 1]}`);

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentSerial = parseInt(sorted[i]?.split('-').pop() || '0');
      const nextSerial = parseInt(sorted[i + 1]?.split('-').pop() || '0');
      
      // Explicit assertion: The difference between sequential serials must be exactly 1
      expect(nextSerial, `Gap detected between ${sorted[i]} and ${sorted[i+1]}`).toBe(currentSerial + 1);
    }
  });
});
