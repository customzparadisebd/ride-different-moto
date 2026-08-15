import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Manual client for test environment to bypass start context
const testSupabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Invoice Concurrency Uniqueness', () => {
  it('should generate unique invoice serials under parallel load', async () => {
    // Execute 10 calls to the database function simultaneously
    const tasks = Array.from({ length: 10 }).map(() => 
      testSupabase.rpc('generate_next_invoice_no', { is_test: true })
    );
    
    const results = await Promise.all(tasks);
    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    const errors = results.map(r => r.error).filter(Boolean);
    
    expect(errors.length).toBe(0);
    expect(invoices.length).toBe(10);
    
    const uniqueInvoices = new Set(invoices);
    expect(uniqueInvoices.size).toBe(10);
    
    // Sequence Continuity Verification
    const sorted = [...invoices].sort();
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = parseInt(sorted[i]?.split('-').pop() || '0');
      const next = parseInt(sorted[i+1]?.split('-').pop() || '0');
      expect(next).toBe(current + 1);
    }
  });
});
